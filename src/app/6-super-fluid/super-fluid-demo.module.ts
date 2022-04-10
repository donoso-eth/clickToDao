import { InjectionToken, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperFluidDemoComponent } from './super-fluid-demo/super-fluid-demo.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

import { DappLoadingModule, DialogModule, NotifierModule} from '../dapp-components'


import { ICONTRACT_METADATA } from 'angular-web3';
import { QuillModule } from 'ngx-quill'
import SuperFluidMetadata from '../../assets/contracts/fluid_dao_metadata.json';
import { CreateProposalComponent } from './create-proposal/create-proposal.component';
import { OnlyOwnerComponent } from './only-owner/only-owner.component';
import { MemberDashboardComponent } from './member-dashboard/member-dashboard.component';
export const contractMetadata = new InjectionToken<ICONTRACT_METADATA>('contractMetadata')

export const contractProvider= {provide: 'contractMetadata', useValue:SuperFluidMetadata };



@NgModule({
  declarations: [
    SuperFluidDemoComponent,
    CreateProposalComponent,
    OnlyOwnerComponent,
    MemberDashboardComponent,

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    DialogModule,
    NotifierModule,
    DappLoadingModule,
    QuillModule.forRoot({}),
  ],
  exports: [
    SuperFluidDemoComponent
  ],
  providers: [contractProvider]
})
export class SuperFluidDemoModule { }
