import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjectorService, Web3Actions } from 'angular-web3';
import { utils } from 'ethers';
import { AlertService } from 'src/app/dapp-components';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';

@Component({
  selector: 'create-proposal',
  templateUrl: './create-proposal.component.html',
  styleUrls: ['./create-proposal.component.scss']
})
export class CreateProposalComponent extends DappBaseComponent {
  proposalForm: FormGroup;;
  show_create_success = false;
  constructor(
    public formBuilder: FormBuilder,
    dapp:DappInjectorService,
    store:Store,
    private ipfsService: IpfsStorageService,
    private alertService:AlertService

  ) { 
    super(dapp,store)

    this.proposalForm = this.formBuilder.group({
      titleCtrl: ['', [Validators.required]],
      descriptionCtrl: [
        '',
        [Validators.required],
      ],
    });
    console.log(this.proposalForm)
  }

  @Output() private close = new EventEmitter<boolean>()


  back() {
    this.close.emit()
  }

  async createProposal() {
    if (this.proposalForm.invalid){
      alert("Please fill")
      return
    }
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    try {

    console.log(this.proposalForm.controls['titleCtrl'].value)

    const payload = {
      content:this.proposalForm.controls['descriptionCtrl'].value,
      title:this.proposalForm.controls['titleCtrl'].value
    }
    console.log(payload)
    const myFile = new File([JSON.stringify(payload)],'proposal.txt');
    const cid = await this.ipfsService.addFile(myFile)
    console.log(cid)

    const result = await this.defaultContract.runFunction('submitNewProposal',[cid,{ gasPrice: utils.parseUnits('100', 'gwei'), 
    gasLimit: 2000000 }])

    console.log(result)
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    // bafybeihkcv64gshryyuywwieb2ckz562ahtuflzr3ypnwvmj7tlvelbsda
    if(result.msg.success == true) {
      this.alertService.showAlertOK('OK', 'You just create a Proposal')
      this.back();
    } else {
      const myError = (result.msg.error_message as string).replace('Error: VM Exception while processing transaction: reverted with reason string ','')
      await this.alertService.showAlertERROR('OOPS', `EVM error ${myError}`)
    }


  } catch (error) {
    console.log(error)

    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
    this.alertService.showAlertERROR('OOPS', 'Something wrong has happened')
  }

  }

  content(obj:any){

    this.proposalForm.controls['descriptionCtrl'].setValue(obj.html);
 

  }

  ngOnInit(): void {
  }

}
