import { Contract, Provider } from 'zksync-web3';
import { AtlasEnvironment } from "atlas-ide";

import CounterArtifact from "../artifacts/L2-counter";

const COUNTER_CONTRACT = '<COUNTER_CONTRACT>';

async function main(atlas: AtlasEnvironment) {
  // Initialize the provider
  const l2Provider = new Provider('https://testnet.era.zksync.dev');

  const counterContract = new Contract(
    COUNTER_CONTRACT,
    CounterArtifact.Counter.abi,
    l2Provider
  );

  const value = (await counterContract.value()).toString();

  console.log(`The counter value is ${value}`);
}

