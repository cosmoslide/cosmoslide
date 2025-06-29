import { ModuleMetadata, Type } from '@nestjs/common';

export interface FedifyModuleOptions {
  kv?: any;
  queue?: any;
  documentLoader?: any;
  contextLoader?: any;
  authenticatedDocumentLoaderFactory?: any;
  onNotFound?: any;
  onNotAcceptable?: any;
  [key: string]: any;
}

export interface FedifyOptionsFactory {
  createFedifyOptions(): Promise<FedifyModuleOptions> | FedifyModuleOptions;
}

export interface FedifyModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<FedifyOptionsFactory>;
  useClass?: Type<FedifyOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<FedifyModuleOptions> | FedifyModuleOptions;
  inject?: any[];
}