import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IpfsStorageService } from './ipfs-storage.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class IpfsStorageModule {
  static forRoot(): ModuleWithProviders<IpfsStorageModule> {
    return {
      ngModule: IpfsStorageModule,
      providers: [IpfsStorageService],
    };
  }
}
