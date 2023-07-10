import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { Provider, utils } from "zksync-web3";
import { AtlasEnvironment } from "atlas-ide";

import GovernanceArtifact from "../artifacts/Governance";
import L2CounterArtifact from "../artifacts/L2-counter";

const GOVERNANCE_ABI = GovernanceArtifact.Governance.abi;
const GOVERNANCE_ADDRESS = '<GOV_CONTRACT>';
const COUNTER_ABI = L2CounterArtifact.Counter.abi;
const COUNTER_ADDRESS = '<COUNTER_CONTRACT>';

async function main(atlas: AtlasEnvironment) {
  // Enter your Ethereum L1 provider RPC URL.
  const l1Provider = new ethers.providers.Web3Provider(atlas.provider);
  if((await l1Provider.getNetwork()).chainId !== 5){
    throw new Error("Must be connected to Goerli within Atlas");
  }
  // Set a constant that accesses the Layer 1 contract.
  const wallet = l1Provider.getSigner();
  console.log("Using wallet", await wallet.getAddress());
  const govcontract = new Contract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, wallet);

  // Initialize the L2 provider.
  const l2Provider = new Provider("https://testnet.era.zksync.dev");
  // Get the current address of the zkSync L1 bridge.
  const zkSyncAddress = await l2Provider.getMainContractAddress();
  console.log("zkSync bridge address", zkSyncAddress);
  // Get the `Contract` object of the zkSync bridge.
  const zkSyncContract = new Contract(zkSyncAddress, utils.ZKSYNC_MAIN_ABI, wallet);

  // Encoding the L2 transaction is done in the same way as it is done on Ethereum.
  // Use an Interface which gives access to the contract functions.
  const counterInterface = new ethers.utils.Interface(COUNTER_ABI);
  const data = counterInterface.encodeFunctionData("increment", []);

  // The price of an L1 transaction depends on the gas price used.
  // You should explicitly fetch the gas price before making the call.
  const gasPrice = await l1Provider.getGasPrice();

  // Define a constant for gas limit which estimates the limit for the L1 to L2 transaction.
  const gasLimit = await l2Provider.estimateL1ToL2Execute({
    contractAddress: COUNTER_ADDRESS,
    calldata: data,
    caller: utils.applyL1ToL2Alias(GOVERNANCE_ADDRESS) 
  });
  // baseCost takes the price and limit and formats the total in wei.
  // For more information on `REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT` see the [fee model documentation](../../reference/concepts/transactions/fee-model.md).
  const baseCost = await zkSyncContract.l2TransactionBaseCost(
    gasPrice,
    gasLimit,
    utils.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT
  );

  // !! If you don't include the gasPrice and baseCost in the transaction, a re-estimation of fee may generate errors.
  const tx = await govcontract.callZkSync(zkSyncAddress, COUNTER_ADDRESS, data, gasLimit, utils.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT, {
    // Pass the necessary ETH `value` to cover the fee for the operation
    value: baseCost,
    gasPrice,
  });
  console.log("Waiting for L1 confirmation...");
  // Wait until the L1 tx is complete.
  await tx.wait();
  console.log("Waiting for L2 confirmation...");

  // Get the TransactionResponse object for the L2 transaction corresponding to the execution call.
  // ( Can take up to 15 minutes )
  const l2Response = await l2Provider.getL2TransactionFromPriorityOp(tx);

  // Output the receipt of the L2 transaction corresponding to the call to the counter contract.
  const l2Receipt = await l2Response.wait();
  console.log("L2 confirmed...");
  console.log(l2Receipt);
  
}

