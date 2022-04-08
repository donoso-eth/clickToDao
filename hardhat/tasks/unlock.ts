
import { task } from 'hardhat/config';
import { initEnv } from './helpers/utils';
import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BytesLike } from 'ethers';

task('unlock', 'play test the protocol').setAction(async ({}, hre) => {



        const ethers = hre.ethers;;

        const [deployer, user1,user2,user3,user4] = await initEnv(hre)
        const deployer_address = await deployer.getAddress();

        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [deployer_address ],
        });
      
      
        // const deployer_wallet = new ethers.Wallet(deployerKey);
        // console.log("impersonating account: " );



//  const latestBlock = await hre.ethers.provider.getBlock("latest")

//     console.log(latestBlock)
 })