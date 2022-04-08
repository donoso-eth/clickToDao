
import { task } from 'hardhat/config';
import { initEnv } from './helpers/utils';
import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('play', 'play test deployment').setAction(async ({}, hre) => {

const ethers = hre.ethers;

 const [deployer, user1,user2,user3,user4] = await initEnv(hre)


 
console.log(await deployer.getAddress())

//  const latestBlock = await hre.ethers.provider.getBlock("latest")

//     console.log(latestBlock)
 })