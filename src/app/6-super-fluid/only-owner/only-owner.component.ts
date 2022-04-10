import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjectorService } from 'angular-web3';
import { AlertService } from 'src/app/dapp-components';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';

@Component({
  selector: 'only-owner',
  templateUrl: './only-owner.component.html',
  styleUrls: ['./only-owner.component.scss']
})
export class OnlyOwnerComponent extends DappBaseComponent{

  constructor(    public formBuilder: FormBuilder,
    dapp:DappInjectorService,
    store:Store,
    private ipfsService: IpfsStorageService,
    private alertService:AlertService) {
      super(dapp,store)
     }

  override async hookContractConnected(): Promise<void> {
      
 
  }   

  ngOnInit(): void {
  }

}
