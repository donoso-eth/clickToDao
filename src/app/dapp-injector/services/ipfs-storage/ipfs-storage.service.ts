import { Inject, Injectable } from '@angular/core';

import { NFTStorage, File,toGatewayURL } from 'nft.storage';

import { Web3Storage} from 'web3.storage'

// The 'mime' npm package helps us set the correct file type on our File objects
import { getType } from 'mime';

import { environment } from 'src/environments/environment';
import { DOCUMENT } from '@angular/common';

declare global {
  interface Window {
    IpfsHttpClient: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class IpfsStorageService {
  ipfs: any;
  loading = true;
  constructor(  @Inject(DOCUMENT) private readonly document: any) {}

  /**************************************************************************
   * NFT UPLOADS
   *************************************************************************/

  async storeNFT(payload: {
    name: string;
    description: string;
    image: string;
    pathname: string;
  }) {
    // load the file from disk

    const type = getType(payload.pathname) as string;

    console.log(type);

    const myFile = new File([payload.image], 'image.png', { type });

    // create a new NFTStorage client using our API key
    const nftstorage = new NFTStorage({ token: environment.NFT_STORAGE_TOKEN });
    const buf = Buffer.from(payload.image);
    const de_buffer = Buffer.from(buf);
    const blob = new Blob([de_buffer]);
    // call client.store, passing in the image & metadata
    const result = await nftstorage.store({
      image: myFile,
      name: payload.name,
      description: payload.description,
    });
    console.log(result);
  }

  async retrieveNft(url:string) {

    const result = toGatewayURL(url)
  }

  /**************************************************************************
   * General UPLOADS
   *************************************************************************/

  async addFile(myFile:File){



  const storage = new Web3Storage({ token:environment.WEB3_STORAGE_KEY})
 
  const cid = await storage.put([myFile])

   console.log(cid)
   return cid
  }


  async getImage(hash: string): Promise<any> {
    const responseBufferChunks = []
    for await (const file of this.ipfs.cat(hash)) {
      if (!file) continue;
      responseBufferChunks.push(file);
    }
    const responseBuffer = Buffer.concat(responseBufferChunks)
    return responseBuffer

  }


  async getFile(hash: string): Promise<any> {
    const responseBufferChunks = []
    for await (const file of this.ipfs.cat(hash)) {
      if (!file) continue;
      responseBufferChunks.push(file);
    }
    const responseBuffer = Buffer.concat(responseBufferChunks)
    return JSON.parse(responseBuffer.toString())

  }

  /**************************************************************************
   * IPFS initialization
   *************************************************************************/
   loadTagToPromise(options:{name:string, type:'script' | 'link',  args:Array<{name:string, value:string}>}){
    if (document.getElementById(options.name) !== null) { 
        return true
    }
    const promiseTag = new Promise<void>((resolve, reject) => {
      let tag = this.document.createElement(options.type);
      try {
        
    
        for (const attribute of options.args) {
          tag[attribute.name]= attribute.value
        
      }

        tag.onload = () => {
      
          resolve();
        };
        this.document.body.appendChild(tag);
      } catch (error) {
        reject();
        console.log(error);
      }
    });
    return promiseTag
  }

   async init() {
    if (this.loading == true) {
      await this.loadTagToPromise({
        name: 'jsoneditor_css',
        type: 'link',
        args: [
          { name: 'rel', value: 'stylesheet' },
          {
            name: 'href',
            value: 'https://unpkg.com/jsoneditor@9.6.0/dist/jsoneditor.min.css',
          },
        ],
      });

      await this.loadTagToPromise({
        name: 'ipfs_client',
        type: 'script',
        args: [
          {
            name: 'src',
            value:
              'https://cdn.jsdelivr.net/npm/ipfs-http-client/dist/index.min.js',
          },
          { name: 'type', value: 'text/javascript' },
        ],
      });

      this.ipfs = window.IpfsHttpClient.create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
      });
      this.loading = false;
    }
  }
}
