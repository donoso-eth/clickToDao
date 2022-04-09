import { expect } from 'chai';
import { ethers,network } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BaseProvider } from '@ethersproject/providers';
import { FluidDao__factory } from '../typechain-types';

describe('Initialize DAO', function () {
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
  // it('Should I be member after starting stream (mock)', async function () {
  //   let active = await fluidDaoContract.isMember(owner.address);
  //   expect(active).equal(0)
  //   await fluidDaoContract.mockAddPermision()
  //   active = await fluidDaoContract.isMember(owner.address);
  //   expect(active).equal(1)
 
  // });

  it('I present a proposal, proposals id augmentd by 1', async function () {
    await fluidDaoContract.mockAddPermision()
    const tx = await fluidDaoContract.submitNewProposal("uiiiiii");
    const proposals = await fluidDaoContract._activeProposalsArray(0)
    expect(+proposals.toString()).equal(1)
 
  });

  it('I present a proposal, proposals id augmentd by 1', async function () {
    await fluidDaoContract.mockAddPermision()
    await fluidDaoContract.submitNewProposal("uiiiiii");
    const proposals = await fluidDaoContract._activeProposalsArray(0)
    expect(+proposals.toString()).equal(1)
    const user1Contract = await fluidDaoContract.connect(addr1)
    await expect (  user1Contract.vote(1,true)).to.be.revertedWith("NOT_MEMBER");
    await user1Contract.mockAddPermision()
    await user1Contract.vote(1,true);
    let user1Vote  = await user1Contract._votingByProposal(1,addr1.address);

    const PROPOSAL_PERIOD = +(await fluidDaoContract.PROPOSAL_PERIOD()).toString();
    const INFLOW_MAX = +(await fluidDaoContract.INFLOW_MAX()).toString();
  

    expect (+user1Vote.toString()).equal(INFLOW_MAX)

    //// Second Proposal AND WEIGHTER
    await fluidDaoContract.submitNewProposal("uiiiiii_OOOOO");
    await user1Contract.vote(2,false);
    user1Vote  = await user1Contract._votingByProposal(1,addr1.address);
    let user1Vote2  = await user1Contract._votingByProposal(2,addr1.address);
    expect (+user1Vote.toString()).equal(INFLOW_MAX/2)
    expect (+user1Vote2.toString()).equal(-INFLOW_MAX/2)


    //// expected NEtFLOW
    let netflow = +(await fluidDaoContract._netFlow()).toString()
    expect(netflow).equal(2*INFLOW_MAX)

    //// try cote after period ginish
    await expect ( fluidDaoContract.calculateResult(1)).to.be.revertedWith("PROPOSAL_STILL_ACTIVE");
    
   let latestBlock = await ethers.provider.getBlock("latest")

    await network.provider.send("evm_increaseTime", [PROPOSAL_PERIOD + 1])
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
    latestBlock = await ethers.provider.getBlock("latest")
 
    let result = await user1Contract._proposals(1);
    expect(+result.activeIndex.toString()).equal(0)

    await fluidDaoContract.calculateResult(1)


    result = await user1Contract._proposals(1);
    expect(+result.activeIndex.toString()).equal(5)

    //// PROPOSAL 1 SHOULD BE WINING 
    let winProposal = await fluidDaoContract._winningProposalsArray(0);
    let winProposalsCount = await fluidDaoContract._winningProposals();
    
    expect (+winProposal.toString()).equal(1);
    expect (+winProposalsCount.toString()).equal(1);
   
  });



});
