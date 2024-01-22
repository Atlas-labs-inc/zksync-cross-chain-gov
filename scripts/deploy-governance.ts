// Deploy to Goerli
import { ethers } from "ethers";
import GovernanceArtifact from "../artifacts/Governance";
import { AtlasEnvironment } from "atlas-ide";

async function main(atlas: AtlasEnvironment) {
    const provider = new ethers.providers.Web3Provider(atlas.provider);

    const signer = provider.getSigner();
    console.log("Connected signer", await signer.getAddress());

    const GovernanceContractFactory = new ethers.ContractFactory(
      GovernanceArtifact.Governance.abi,
      GovernanceArtifact.Governance.evm.bytecode.object,
      signer
    );  

    const contract = await GovernanceContractFactory.deploy();
    // Wait for the transaction to be mined
    const receipt = await contract.deployTransaction.wait();
    console.log('Contract deployed at address:', receipt.contractAddress);
}
