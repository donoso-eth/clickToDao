import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SuperFluidDemoModule } from './6-super-fluid/super-fluid-demo.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DappInjectorModule } from './dapp-injector/dapp-injector.module';
import { StoreModule } from '@ngrx/store';
import { we3ReducerFunction } from 'angular-web3';
import { QuillModule } from 'ngx-quill'
import { AlertsModule } from './dapp-components/alerts';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SuperFluidDemoModule,
    BrowserAnimationsModule,
    DappInjectorModule.forRoot({wallet:'privKey', defaultNetwork:'localhost'}),
    StoreModule.forRoot({web3: we3ReducerFunction}),
    QuillModule.forRoot({}),
    AlertsModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
