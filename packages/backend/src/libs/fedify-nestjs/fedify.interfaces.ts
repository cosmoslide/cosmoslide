import { DocumentLoader, DocumentLoaderFactory, KvStore, MessageQueue } from '@fedify/fedify';
import { ModuleMetadata, Type } from '@nestjs/common';

export interface FedifyModuleOptions {
  kv?: KvStore;
  queue?: MessageQueue;
  documentLoader?: DocumentLoader;
  origin?: string;
}

export interface FedifyOptionsFactory {
  createFedifyOptions(): Promise<FedifyModuleOptions> | FedifyModuleOptions;
}

export interface FedifyModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<FedifyOptionsFactory>;
  useClass?: Type<FedifyOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<FedifyModuleOptions> | FedifyModuleOptions;
}
