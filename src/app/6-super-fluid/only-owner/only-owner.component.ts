import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  AngularContract,
  DappBaseComponent,
  DappInjectorService,
} from 'angular-web3';
import { AlertService } from 'src/app/dapp-components';
import { GraphQlService } from 'src/app/dapp-injector/services/graph-ql/graph-ql.service';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';
import { abi_ERC20 } from 'src/app/dapp-injector/abis/ERC20_ABI';
import { interval, takeUntil } from 'rxjs';
@Component({
  selector: 'only-owner',
  templateUrl: './only-owner.component.html',
  styleUrls: ['./only-owner.component.scss'],
})
export class OnlyOwnerComponent extends DappBaseComponent {
  streams!: Array<any>;
  daiContract: any;
  ERC20_METADATA: any;
  myBalance!: number;
  niceBalance!: string;
  twoDec: string;
  fourDec: string;
  flowRate: number;
  monthlyInflow: number;
  members = [];
  constructor(
    public formBuilder: FormBuilder,
    dapp: DappInjectorService,
    store: Store,
    private grapQlService: GraphQlService,
    private ipfsService: IpfsStorageService,
    private alertService: AlertService
  ) {
    super(dapp, store);
    this.ERC20_METADATA = {
      abi: abi_ERC20,
      address: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      network: 'mumbai',
    };
  }

  async getStreams() {
    const result = await this.grapQlService.query(this.defaultContract.address);
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

  override async hookContractConnected(): Promise<void> {
    this.daiContract = new AngularContract({
      metadata: this.ERC20_METADATA,
      provider: this.dapp.provider!,
      signer: this.dapp.signer!,
    });
    await this.daiContract.init();

    this.myBalance = +(
      await this.daiContract.contract['balanceOf'](this.defaultContract.address)
    ).toString();

    this.prepareNumbers(this.myBalance);

    await this.getStreams();
  }

  prepareNumbers(balance: number) {
    this.niceBalance = (balance / 10 ** 18).toFixed(0);

    const niceTwo = (balance / 10 ** 18).toFixed(2);
    this.twoDec = niceTwo.substring(niceTwo.length - 2, niceTwo.length);

    const niceFour = (balance / 10 ** 18).toFixed(6);

    this.fourDec = niceFour.substring(niceFour.length - 4, niceFour.length);
  }


  ngOnInit(): void {}
}
