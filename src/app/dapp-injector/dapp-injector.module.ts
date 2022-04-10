import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DappInjectorService } from './dapp-injector.service';
import { IDAPP_CONFIG } from './models';
import { GraphQlService } from './services/graph-ql/graph-ql.service';
import { GraphQlModule } from './services/graph-ql/graph-ql.module';

export const DappConfigService = new InjectionToken<IDAPP_CONFIG>('DappConfig');

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GraphQlModule.forRoot({uri:"https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai"})
  ],
})
export class DappInjectorModule {
  static forRoot(dappConfig: IDAPP_CONFIG): ModuleWithProviders<DappInjectorModule> {
    return {
      ngModule: DappInjectorModule,
      providers: [DappInjectorService, { provide: DappConfigService, useValue: dappConfig }],
    };
  }
}
