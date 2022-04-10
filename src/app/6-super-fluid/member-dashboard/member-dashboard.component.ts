import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Framework } from '@superfluid-finance/sdk-core';
import {
  DappBaseComponent,
  DappInjectorService,
  Web3Actions,
} from 'angular-web3';
import { utils } from 'ethers';

import { AlertService } from 'src/app/dapp-components';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';

@Component({
  selector: 'member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.scss'],
})
export class MemberDashboardComponent extends DappBaseComponent {
  myBalance: number;
  isMember = false;
  viewState: 'not-connected' | 'menu' | 'create-proposal'  = 'not-connected' ;
  constructor(
    public formBuilder: FormBuilder,
    dapp: DappInjectorService,
    store: Store,
    private ipfsService: IpfsStorageService,
    private alertService: AlertService
  ) {
    super(dapp, store);


  }

  @Output()  onIsMember = new EventEmitter<boolean>()

  override async hookContractConnected(): Promise<void> {
    this.isMember = await this.checkMemberShip();
  }

  async startStream() {

    if(this.dapp.connectedNetwork == 'localhost'){
      this.mockStartStream()
      return
    }

    if (this.myBalance == 0) {
      this.alertService.showAlertERROR(
        'OOPS',
        'to Start the subscription uyou require some tokens'
      );
      return;
    }

    try {
      this.store.dispatch(Web3Actions.chainBusy({ status: true }));

      const contractAddress = this.dapp.defaultContract!.address;

      const flowRate = '3858024691358';

      const sf = await Framework.create({
        networkName: 'mumbai',
        provider: this.dapp.provider!,
      });

      //const encodedData = utils.defaultAbiCoder.encode(['uint256'], [1]);

      const createFlowOperation = sf.cfaV1.createFlow({
        flowRate: flowRate,
        receiver: contractAddress,
        superToken: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f', //environment.mumbaiDAIx,
        userData: '0x',
        overrides: {
          gasPrice: utils.parseUnits('100', 'gwei'),
          gasLimit: 2000000,
        },
      });
      console.log('Creating your stream...');

      const result = await createFlowOperation.exec(this.dapp.signer);
      const result2 = await result.wait();

      console.log(
        `Congrats - you've just created a money stream!
View Your Stream At: https://app.superfluid.finance/dashboard/${contractAddress}`
      );
      this.isMember = await this.checkMemberShip();
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    } catch (error) {
      console.log(error);
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    }
  }

  async stopStream() {
    if(this.dapp.connectedNetwork == 'localhost'){
      this.mockStopStream()
      return
    }

    try {
      this.store.dispatch(Web3Actions.chainBusy({ status: true }));
  
      const contractAddress = this.dapp.defaultContract.address;
      console.log(contractAddress);
      const flowRate = '0';
 
      const sf = await Framework.create({
        networkName: 'mumbai',
        provider: this.dapp.provider,
      });

      const myaddress = await this.dapp.signer.getAddress();
      const createFlowOperation = sf.cfaV1.deleteFlow({
        sender: myaddress,
        receiver: contractAddress,
        superToken: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f', //environment.mumbaiDAIx,
        userData: '0x',
        overrides: {
          gasPrice: utils.parseUnits('100', 'gwei'),
          gasLimit: 2000000,
        },
      });
      console.log('stoping your stream...');

      const result = await createFlowOperation.exec(this.dapp.signer);
      const result2 = await result.wait();

      console.log(result2);

      console.log(
        `Congrats - you've just stoped a money stream  View Your Stream At: https://app.superfluid.finance/dashboard/${contractAddress}`
      );
      this.isMember = await this.checkMemberShip();
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    } catch (error) {
      console.log(error);
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    }
  }

  async mockStopStream() {
   
    await this.defaultContract.runTransactionFunction('mockRevokePermision', [
      { gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 2000000 },
    ]);

    this.isMember = await this.checkMemberShip();
  }

  async mockStartStream() {
  
    await this.defaultContract.runTransactionFunction('mockAddPermision', [
      { gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 2000000 },
    ]);

    this.isMember = await this.checkMemberShip();
  }

  async checkMemberShip() {
    const result = await this.defaultContract.runFunction('isMember', [
      this.dapp.signerAddress,
    ]);

    if (result.payload[0] == 0) {
      this.onIsMember.emit(false)
      return false;
     
    }

    if (result.payload[0] == 1) {
      this.onIsMember.emit(true)
      return true;
    }
    this.onIsMember.emit(false)
    return false;
  }

  createProposal(){
    this.viewState = 'create-proposal';
  }


}
