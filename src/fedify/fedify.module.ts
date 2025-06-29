import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { FEDIFY_OPTIONS, FEDIFY_FEDERATION, FEDIFY_HANDLER_SETUP } from './fedify.constants';
import { FedifyModuleOptions, FedifyModuleAsyncOptions, FedifyOptionsFactory } from './fedify.interfaces';
import { FedifyHandlerSetup } from './fedify.handler-setup';

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
          const importDynamic = new Function('specifier', 'return import(specifier)');
          const { createFederation, MemoryKvStore } = await importDynamic('@fedify/fedify');
          
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
      {
        provide: FEDIFY_HANDLER_SETUP,
        useClass: FedifyHandlerSetup,
      },
    ];

    return {
      module: FedifyModule,
      providers,
      exports: [FEDIFY_FEDERATION, FEDIFY_OPTIONS, FEDIFY_HANDLER_SETUP],
      global: true,
    };
  }

  static forRootAsync(options: FedifyModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      ...this.createAsyncProviders(options),
      {
        provide: FEDIFY_FEDERATION,
        useFactory: async (fedifyOptions: FedifyModuleOptions) => {
          const importDynamic = new Function('specifier', 'return import(specifier)');
          const { createFederation, MemoryKvStore } = await importDynamic('@fedify/fedify');
          
          return createFederation({
            kv: fedifyOptions.kv || new MemoryKvStore(),
            ...fedifyOptions,
          });
        },
        inject: [FEDIFY_OPTIONS],
      },
    ];

    return {
      module: FedifyModule,
      imports: options.imports || [],
      providers,
      exports: [FEDIFY_FEDERATION, FEDIFY_OPTIONS],
      global: true,
    };
  }

  private static createAsyncProviders(options: FedifyModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    
    const useClass = options.useClass as Type<FedifyOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: FedifyModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: FEDIFY_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<FedifyOptionsFactory>,
    ];

    return {
      provide: FEDIFY_OPTIONS,
      useFactory: async (optionsFactory: FedifyOptionsFactory) =>
        await optionsFactory.createFedifyOptions(),
      inject,
    };
  }
}