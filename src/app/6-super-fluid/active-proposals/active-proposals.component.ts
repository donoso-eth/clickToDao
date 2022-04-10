import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjectorService } from 'angular-web3';
import { AlertService } from 'src/app/dapp-components';
import { GraphQlService } from 'src/app/dapp-injector/services/graph-ql/graph-ql.service';
import { IpfsStorageService } from 'src/app/dapp-injector/services/ipfs-storage/ipfs-storage.service';

@Component({
  selector: 'active-proposals',
  templateUrl: './active-proposals.component.html',
  styleUrls: ['./active-proposals.component.scss'],
})
export class ActiveProposalsComponent extends DappBaseComponent {
  proposalsCount: number;
  viewState: 'none' | 'view-proposal' = 'none';
  proposals: Array<{
    sender: string;
    proposalUri: string;
    title: string;
    content: string;
    id:number;
  }> = [];
  currentProposal: {
    sender: string;
    proposalUri: string;
    title: string;
    content: string;
    id:number;
  };
  constructor(
    public formBuilder: FormBuilder,
    dapp: DappInjectorService,
    store: Store,
    private grapQlService: GraphQlService,
    private ipfsService: IpfsStorageService,
    private alertService: AlertService
  ) {
    super(dapp, store);
  }

  async hookContractConnected(): Promise<void> {
    console.log('myproposals');
    await this.ipfsService.init();
    const proposals_query = await this.defaultContract.runFunction(
      '_activeProposal',
      []
    );
    this.proposalsCount = +proposals_query.payload[0].toString();
    console.log(this.proposalsCount);
    for (let i = 1; i <= this.proposalsCount; i++) {
      console.log(i);
      const proposal_query = await this.defaultContract.runFunction(
        '_proposals',
        [i]
      );

        console.log(proposal_query)

      const result = await this.ipfsService.getWeb3Storage(
        proposal_query.payload.proposalUri
      );
      console.log(result);

      const ipfs_Object = await this.ipfsService.getFile(result.cid);
      console.log(ipfs_Object);
      this.proposals.push({
        title: ipfs_Object.title,
        content: ipfs_Object.content,
        sender: proposal_query.payload.sender,
        proposalUri: result.cid,
        id:i
      });

      // return
      // const reader = new FileReader();
      // reader.addEventListener('load', async (event: any) => {
      //   const json_a  = event.target.result;
      //  console.log(json_a)
      // });
      // reader.readAsDataURL(result);
    }

    console.log(this.proposalsCount);
  }

  viewProposal(proposal) {
    this.currentProposal = proposal;
    console.log(this.currentProposal);
    this.viewState = 'view-proposal';
  }

  ngOnInit(): void {}
}
