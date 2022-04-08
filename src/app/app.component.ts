import { Component } from '@angular/core';
import { IpfsStorageService } from './dapp-injector/services/ipfs-storage/ipfs-storage.service';
// Import the NFTStorage class and File constructor from the 'nft.storage' package

import { avatarBase64, nftBase64 } from './shared/constant/avatar.base64';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'clickToDao';
  image_src: any;
  constructor(private ipfs:IpfsStorageService){
    this.image_src = nftBase64;
  }

  uploadProfile(event:any) {
    const file: File = event.target.files[0];
    console.log(file, 'fileeeee');
    const reader = new FileReader();
    reader.addEventListener('load', async (event: any) => {
      this.image_src = event.target.result;
      const buf = Buffer.from(reader.result as ArrayBuffer);
    });
    reader.readAsDataURL(file);

  }

  addFile(){
    this.ipfs.addFile(this.image_src)
  }


}
