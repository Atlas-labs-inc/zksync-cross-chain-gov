// Deploy to zksync
import * as zksync from "zksync-web3";
import { ethers }  from "ethers";
import { AtlasEnvironment } from "atlas-ide";

import L2CounterArtifact from "../artifacts/L2-counter";

const GOV_CONTRACT = "<GOV_CONTRACT>";


async function main(atlas: AtlasEnvironment) {
    const provider = new zksync.Web3Provider(atlas.provider);
    const connectedChainID = (await provider.getNetwork()).chainId;
    if(connectedChainID !== 300 && connectedChainID !== 324) {
        throw new Error("Must be connected to zkSync within Atlas");
    }
    const signer = provider.getSigner();
    console.log("Connected signer", await signer.getAddress());
   	const factory = new zksync.ContractFactory(
        L2CounterArtifact.Counter.abi,
        L2CounterArtifact.Counter.evm.bytecode.object,
        signer,
        "create"
    );
    const contract = await factory.deploy(
        ...[zksync.utils.applyL1ToL2Alias(GOV_CONTRACT)],
        {}
    );

	await contract.deployed();
    const receipt = await contract.deployTransaction.wait();
    console.log('Contract deployed at address:', receipt.contractAddress);
}
