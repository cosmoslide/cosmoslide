import { Module, DynamicModule, Provider } from '@nestjs/common';
import { createFederation, MemoryKvStore, KvStore, MessageQueue, DocumentLoader } from '@fedify/fedify';

import { FEDIFY_FEDERATION, FEDIFY_OPTIONS } from './fedify.constants';

export interface FedifyModuleOptions {
  kv?: KvStore;
  queue?: MessageQueue;
  documentLoader?: DocumentLoader;
  origin?: string;
}

@Module({})
export class FedifyModule {
  static forRoot(options: FedifyModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: FEDIFY_FEDERATION,
        useFactory: async () => {
          const federationOptions = {
            kv: options.kv || new MemoryKvStore(),
            ...options,
          };

          const federation = createFederation(federationOptions);

          return federation;
        },
      },
    ];

    return {
      module: FedifyModule,
      providers,
      exports: [FEDIFY_FEDERATION],
      global: true,
    };
  }
}

