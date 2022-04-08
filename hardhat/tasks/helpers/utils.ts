import '@nomiclabs/hardhat-ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BytesLike, Contract, ContractTransaction, Signer, Wallet } from 'ethers';

import * as dotenv from "dotenv";
dotenv.config();
import { HardhatRuntimeEnvironment } from 'hardhat/types';


export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';



export function getHardhatNetwork(hre: HardhatRuntimeEnvironment){
  let network = hre.hardhatArguments.network;
  if (network == undefined) {
    network = hre.network.name
  }
  return network
}

export async function waitForTx(tx: Promise<ContractTransaction>) {
  await (await tx).wait();
}

export async function deployContract(tx: any): Promise<Contract> {
  const result = await tx;
  await result.deployTransaction.wait();
  return result;
}


export const randomString = (length:number): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890';
  const alphabet_length = alphabet.length - 1;
  let password = "";
  for (let i = 0; i < length; i++) {
    const random_number = Math.floor(Math.random() * alphabet_length) + 1;
    password += alphabet[random_number];
  }
  return password
}


export async function impersonate(hre:HardhatRuntimeEnvironment, account:string):Promise<Signer> {

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });

  const signer = await hre.ethers.getSigner(account)
  return signer

}

export async function initEnv(hre: HardhatRuntimeEnvironment): Promise<Signer[]>  {
  
  let network = hre.network.name;
  if (network == "localhost") {
  const ethers = hre.ethers; // This allows us to access the hre (Hardhat runtime environment)'s injected ethers instance easily
  const accounts = await ethers.getSigners(); // This returns an array of the default signers connected to the hre's ethers instance
  const deployer = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];

  return [deployer, user1,user2,user3,user4];
  } else {
    const deployer_provider = hre.ethers.provider
    const deployerKey = process.env["DEPLOYER_KEY"] as BytesLike;
 
    const deployer_wallet = new Wallet(deployerKey);
    const deployer = await deployer_wallet.connect(deployer_provider);


    const privKeyUSER = process.env["USER1_KEY"] as BytesLike;
    const user_wallet = new Wallet(privKeyUSER);
    const user1  = await user_wallet.connect(deployer_provider) ;
   

    const privKeyUSER2 = process.env["USER2_KEY"] as BytesLike;
    const user2_wallet = new Wallet(privKeyUSER2);
    const user2  = await user2_wallet.connect(deployer_provider) ;

    const privKeyUSER3 = process.env["USER3_KEY"] as BytesLike;
    const user3_wallet = new Wallet(privKeyUSER3);
    const user3  = await user3_wallet.connect(deployer_provider) ;

    const privKeyUSER4 = process.env["USER4_KEY"] as BytesLike;
    const user4_wallet = new Wallet(privKeyUSER4);
    const user4  = await user4_wallet.connect(deployer_provider) ;

    console.log(' I am right here')

    return [deployer, user1,user2,user3,user4];

  }
}


async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
