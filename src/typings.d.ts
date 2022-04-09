declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module "*.json" {
    const value: any;
    export default value;
}

declare module '@download/blockies'
declare module 'web3.storage'
declare module 'quill'
declare module 'quill-image-resize-module'