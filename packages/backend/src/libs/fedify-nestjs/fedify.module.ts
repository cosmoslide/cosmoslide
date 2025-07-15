import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { createFederation, MemoryKvStore } from '@fedify/fedify';
import { FEDIFY_OPTIONS, FEDIFY_FEDERATION } from './fedify.constants';
import { FedifyModuleOptions, FedifyModuleAsyncOptions, FedifyOptionsFactory } from './fedify.interfaces';

@Module({})
export class FedifyModule {
  static forRoot(options: FedifyModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: FEDIFY_OPTIONS,
        useValue: options,
      },
      {
        provide: FEDIFY_FEDERATION,
        useFactory: async () => {

          // Create federation without auto-configuring nodeInfo
          const federationOptions = {
            kv: options.kv || new MemoryKvStore(),
            ...options,
          };

          console.log('Creating federation with options:', federationOptions);

          const federation = createFederation(federationOptions);

          return federation;
        },
      },
    ];

    return {
      module: FedifyModule,
      providers,
      exports: [FEDIFY_FEDERATION, FEDIFY_OPTIONS],
      global: true,
    };
  }
}

