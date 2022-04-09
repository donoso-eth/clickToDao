import { expect } from 'chai';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BaseProvider } from '@ethersproject/providers';
import { FluidDao__factory } from '../typechain-types';

describe('Gratitude Campaign CREATOR', function () {
  let fluidDaoContract: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2;
  let addrs;
  let provider: BaseProvider;
  let timeStamp: number;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    provider = ethers.getDefaultProvider();

    const FluidDaoContract = await ethers.getContractFactory(
      'FluidDao'
    );
    fluidDaoContract  = await new FluidDao__factory(owner)
    .deploy("0xEB796bdb90fFA0f28255275e16936D25d3418603",
    "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873",
    "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f");
    await fluidDaoContract.deployed();

    timeStamp = Math.ceil(new Date().getTime() / 1000);
  });
  it('Should I be member after starting stream (mock)', async function () {
    let active = await fluidDaoContract.isMember(owner.address);
    expect(active).equal(0)
    await fluidDaoContract.mockAddPermision()
    active = await fluidDaoContract.isMember(owner.address);
    expect(active).equal(1)
 
  });

  it('I present a proposal, proposals id augmentd by 1', async function () {
  
    let active = await fluidDaoContract.isMember(owner.address);
    await fluidDaoContract.mockAddPermision()


    const id = await fluidDaoContract.submitNewProposal("uiiiiii");
    console.log(id);
    const proposalIds = await fluidDaoContract._proposalIds;
    console.log(proposalIds)
    active = await fluidDaoContract.isMember(owner.address);
    expect(active).equal(1)
 
  });



});
