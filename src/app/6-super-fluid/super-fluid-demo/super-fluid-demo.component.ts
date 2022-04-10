  import { Component, Inject, OnInit } from '@angular/core';
import { Contract, ethers, providers, Signer, utils } from 'ethers';
import { abi_ERC20 } from 'src/app/dapp-injector/abis/ERC20_ABI';

import {
  BlockWithTransactions,
  IBALANCE,
  convertWeiToEther,
  convertEtherToWei,
  displayEther,
  displayUsd,
  convertUSDtoEther,
  Web3State,
  web3Selectors,
  AngularContract,
  DappBaseComponent,
  DappInjectorService,
  Web3Actions,
} from 'angular-web3';
import { Store } from '@ngrx/store';
import { first, firstValueFrom } from 'rxjs';
import { DialogService, NotifierService } from '../../dapp-components';
import { FormControl, Validators } from '@angular/forms';
import { JsonRpcServer } from 'hardhat/types';

@Component({
  selector: 'super-fluid-demo',
  templateUrl: './super-fluid-demo.component.html',
  styleUrls: ['./super-fluid-demo.component.scss'],
})
export class SuperFluidDemoComponent extends DappBaseComponent implements OnInit {

  viewState: 'not-connected' | 'menu' | 'create-proposal'  = 'not-connected' ;
  
  isMember = false;
  walletBalance!: IBALANCE;
  contractBalance!: IBALANCE;
  contractHeader!: any;
  deployer_address!: string;
  //  myContract!: ethers.Contract;
  greeting!: string;
  greeting_input!: string;
  provider!: ethers.providers.JsonRpcProvider;
  //  signer: any;
  deployer_balance: any;


  // newWallet!: ethers.Wallet;
  nameCtrl = new FormControl('', Validators.required)
  imageCtrl = new FormControl('', Validators.required)

  dollarExchange!: number;
  balanceDollar!: number;
  private _dollarExchange!: number;
  daiContract!: AngularContract;
  myBalance!: number;
  niceBalance!: string;
  ERC20_METADATA:any;
  isOwner!: boolean;

  constructor(
    private dialogService: DialogService,
    private notifierService: NotifierService,
   
    dapp: DappInjectorService,
    store: Store<Web3State>
  ) {
    super(dapp, store);
    this.ERC20_METADATA = {
      abi:abi_ERC20,
      address:'0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      network: 'localhost'
  }
}

  async onChainStuff() {
    this.viewState = 'menu';
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.isOwner = false;
    try {
   
      const owner = await this.defaultContract.runFunction('owner',[]);
      
     
      if (this.dapp.signerAddress == owner.payload[0]){
        this.isOwner = true;
      }

    } catch (error) {
        console.log(error)
    }

    try {
      // await this.dapp.init();
      
 


      this.deployer_address = this.dapp.signerAddress!;

      const result  = await this.defaultContract.runFunction('isMember',[this.deployer_address]);
   

      if(result.payload[0]== 0){
        this.isMember = false;
      }

      if(result.payload[0]== 1){
        this.isMember = true;
      }

  

      // if (result.payload[0])


      this.daiContract = new AngularContract({metadata:this.ERC20_METADATA, provider: this.dapp.provider! , signer: this.dapp.signer!})
      await this.daiContract.init()

      this.myBalance = +((await this.daiContract.contract['balanceOf'](this.deployer_address )).toString())
      this.niceBalance = (this.myBalance/(10**18)).toFixed(4)
    
        // this.defaultContract.contract.on('NewGravatar', (args) => {
        //   let payload;
        //   if (typeof args == 'object') {
        //     payload = JSON.stringify(args);
        //   } else {
        //     payload = args.toString();
        //   }
        //   console.log(payload)
        // });
 

        // this.defaultContract.contract.on('UpdatedGravatar', (args,arg2,arg3,arg4) => {
        //   let payload;
        //   console.log(args,arg2,arg3,arg4)
        //   if (typeof args == 'object') {
        //     payload = JSON.stringify(args);
        //   } else {
        //     payload = args.toString();
        //   }
        //   console.log(payload)
        // });
 


      this.contractHeader = {
        name: this.defaultContract.name,
        address: this.defaultContract.address,
        abi: this.defaultContract.abi,
        network: '',
      };
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    } catch (error) {
      console.log(error);
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    }
  }


  connect() {
    this.dapp.launchWebModal()
  }

  createProposal(){
    this.viewState = 'create-proposal';
  }


  // async updateGravatarImage() {
  //   if (this.imageCtrl.invalid){
  //     alert("please input image")
  //     return
  //   }
  //   const image = this.imageCtrl.value;
  //   const result = await this.defaultContract.runFunction('updateGravatarImage', [
  //    image,{ gasPrice: utils.parseUnits('100', 'gwei'), 
  //    gasLimit: 2000000 }
  //   ]);
  
  // }




  async doFaucet() {
    this.blockchain_is_busy = true;
    let amountInEther = '0.1';
    // Create a transaction object

    let tx = {
      to: await this.dapp.signerAddress,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amountInEther),
    };

    const deployer = await this.defaultProvider.getSigner();

    // Send a transaction
    const transaction_result = await this.dapp.doTransaction(tx, deployer);
    this.blockchain_is_busy = false;
    await this.notifierService.showNotificationTransaction(transaction_result);
  }

  async openTransaction() {
    //  console.log(await this.getDollarEther());
    this.blockchain_is_busy = true;
    const res = await this.dialogService.openDialog();

    if (res && res.type == 'transaction') {
      const usd = res.amount;
      //  const amountInEther = convertUSDtoEther(res.amount, await this.getDollarEther());
      const amountinWei = 0; //convertEtherToWei(amountInEther);

      let tx = {
        to: res.to,
        // Convert currency unit from ether to wei
        value: amountinWei,
      };

      const transaction_result = await this.dapp.doTransaction(tx);
      this.blockchain_is_busy = false;
      await this.notifierService.showNotificationTransaction(
        transaction_result
      );
    } else {
      this.blockchain_is_busy = false;
    }
  }



  override async hookChainIsLoading() {
    
  }




  ngOnInit(): void {}

  override async hookFailedtoConnectNetwork(): Promise<void> {
    console.log('Failed to Connect');
  }

  override async hookContractConnected(): Promise<void> {
    console.log('CONNECTED COMPONENT');
    this.onChainStuff();
  }

  override async hookWalletNotConnected(): Promise<void> {
      console.log('not connected')
      console.log(this.viewState)
  }


  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    console.log('AFTER View init Component');
  }
}
