import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Framework } from '@superfluid-finance/sdk-core';
import {
  AngularContract,
  DappBaseComponent,
  DappInjectorService,
  Web3Actions,
} from 'angular-web3';
import { utils } from 'ethers';
import { interval, takeUntil } from 'rxjs';
import { abi_ERC20 } from 'src/app/dapp-injector/abis/ERC20_ABI';
import { AlertService } from 'src/app/dapp-components';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';
import { GraphQlService } from 'src/app/dapp-injector/services/graph-ql/graph-ql.service';

@Component({
  selector: 'member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.scss'],
})
export class MemberDashboardComponent extends DappBaseComponent {
  myBalance: number;
  isMember = false;
  viewState: 'not-connected' | 'menu' | 'create-proposal'  = 'not-connected' ;

  streams: any;
  flowRate: number;
  monthlyInflow: number;
  niceBalance: string;
  twoDec: string;
  fourDec: string;
  daiContract: any;
  ERC20_METADATA: any;
  constructor(
    public formBuilder: FormBuilder,
    dapp: DappInjectorService,
    store: Store,
    private ipfsService: IpfsStorageService,
    private alertService: AlertService,
    private grapQlService:GraphQlService,
  ) {
    super(dapp, store);
    this.ERC20_METADATA = {
      abi: abi_ERC20,
      address: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      network: 'mumbai',
    };

  }

  @Output()  onIsMember = new EventEmitter<boolean>()


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
    console.log('mockjing')
    await this.defaultContract.runTransactionFunction('mockAddPermision', [
      { gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 2000000 },
    ]);

    this.isMember = await this.checkMemberShip();
  }

  async checkMemberShip() {
 
    const result = await this.defaultContract.runFunction('isMember', [
      this.dapp.signerAddress,
    ]);

    console.log(result.payload[0])

    if (result.payload[0] == 2 || result.payload[0] == 1 || result.payload[0] == 4) {
      this.onIsMember.emit(true)
      return true;
    }
    this.onIsMember.emit(false)
    return false;
  }

  createProposal(){
    this.viewState = 'create-proposal';
  }
  override async hookContractConnected(): Promise<void> {
    this.isMember = await this.checkMemberShip();
    this.daiContract = new AngularContract({
      metadata: this.ERC20_METADATA,
      provider: this.dapp.provider!,
      signer: this.dapp.signer!,
    });
    await this.daiContract.init();

    this.myBalance = +(
      await this.daiContract.contract['balanceOf'](this.defaultContract.address)
    ).toString();
      console.log(this.myBalance)
    this.prepareNumbers(this.myBalance);

    await this.getStreams();
  }


  async getStreams() {
    console.log(this.dapp.signerAddress)
    const result = await this.grapQlService.query(this.dapp.signerAddress);
    this.streams = result.streams;
    console.log(this.streams);
    this.flowRate = 0;
    for (const stream of this.streams) {
      console.log(stream);
      this.flowRate = this.flowRate + +stream.currentFlowRate;
    }
    console.log(this.flowRate);
    this.monthlyInflow = +((this.flowRate * 30 * 24 * 60 * 60)/10**18).toFixed(2);;


    console.log(this.monthlyInflow)
    const source = interval(100);
    //output: 0,1,2,3,4,5....
    const subscribe = source
      .pipe(takeUntil(this.destroyHooks))
      .subscribe((val) => {
        this.prepareNumbers(+this.myBalance + (val * this.flowRate) / 10);
      });

      
  }

  prepareNumbers(balance: number) {
    this.niceBalance = (balance / 10 ** 18).toFixed(0);

    const niceTwo = (balance / 10 ** 18).toFixed(2);
    this.twoDec = niceTwo.substring(niceTwo.length - 2, niceTwo.length);

    const niceFour = (balance / 10 ** 18).toFixed(6);

    this.fourDec = niceFour.substring(niceFour.length - 4, niceFour.length);
  }

}
