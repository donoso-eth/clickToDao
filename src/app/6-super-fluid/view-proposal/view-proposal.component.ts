import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  DappBaseComponent,
  DappInjectorService,
  Web3Actions,
} from 'angular-web3';
import { utils } from 'ethers';
import { AlertService } from 'src/app/dapp-components';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';

@Component({
  selector: 'view-proposal',
  templateUrl: './view-proposal.component.html',
  styleUrls: ['./view-proposal.component.scss'],
})
export class ViewProposalComponent
  extends DappBaseComponent
  implements AfterViewInit
{
  show_create_success = false;
  viewState: 'none' | 'view-proposal';
  showEditor = false;
  constructor(
    public formBuilder: FormBuilder,
    dapp: DappInjectorService,
    store: Store,
    private ipfsService: IpfsStorageService,
    private alertService: AlertService,
    private cd: ChangeDetectorRef
  ) {
    super(dapp, store);
    console.log(this.proposal);
  }
  @Output() private close = new EventEmitter<boolean>();
  @Input() public proposal: {
    id: number;
    sender: string;
    proposalUri: string;
    title: string;
    content: string;
  };
  back() {
    this.close.emit(true);
  }

  editorCreated(editor) {
    console.log(editor);
  }
 
  async execute() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    try {
      const result = await this.defaultContract.runFunction('calculateResult', [
        this.proposal.id,
        { gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 2000000 },
      ]);

      console.log(result);
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      // bafybeihkcv64gshryyuywwieb2ckz562ahtuflzr3ypnwvmj7tlvelbsda
      if (result.msg.success == true) {
           const proposal_query = await this.defaultContract.runFunction(
          '_proposals',
          [this.proposal.id]
        );
          console.log(proposal_query.payload)
          if (proposal_query.payload.status == 3){
            this.show_create_success = true;
          } else {
            this.alertService.showAlertOK('OK', `You executed the calculation for proposal ${this.proposal.title}`);
            this.back();
          }


       
      } else {
        const myError = (result.msg.error_message as string).replace(
          'Error: VM Exception while processing transaction: reverted with reason string ',
          ''
        );
        await this.alertService.showAlertERROR('OOPS', `EVM error ${myError}`);
      }
    } catch (error) {
      console.log(error);

      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.alertService.showAlertERROR('OOPS', 'Something wrong has happened');
    }
  }
  async vote(value: any) {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    try {
      const result = await this.defaultContract.runFunction('vote', [
        this.proposal.id,
        value,
        { gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 2000000 },
      ]);

      console.log(result);
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      // bafybeihkcv64gshryyuywwieb2ckz562ahtuflzr3ypnwvmj7tlvelbsda
      if (result.msg.success == true) {
        this.alertService.showAlertOK('OK', 'You just VOTED');
        this.back();
      } else {
        const myError = (result.msg.error_message as string).replace(
          'Error: VM Exception while processing transaction: reverted with reason string ',
          ''
        );
        await this.alertService.showAlertERROR('OOPS', `EVM error ${myError}`);
      }
    } catch (error) {
      console.log(error);

      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.alertService.showAlertERROR('OOPS', 'Something wrong has happened');
    }
  }

  async hookWalletNotConnected(): Promise<void> {
    // this.showEditor = true;
    // this.cd.detectChanges()
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.showEditor = true;
    this.cd.detectChanges();
  }
}
