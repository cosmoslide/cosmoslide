# fedify-nestjs

NestJS integration for [Fedify](https://fedify.dev) - A TypeScript library for building federated server apps powered by ActivityPub and other standards.

## Installation

```bash
npm install fedify-nestjs @fedify/fedify
# or
yarn add fedify-nestjs @fedify/fedify
```

## Quick Start

### 1. Import FedifyModule

```typescript
import { Module } from '@nestjs/common';
import { FedifyModule } from 'fedify-nestjs';

@Module({
  imports: [
    FedifyModule.forRoot({
      // Federation options
    }),
  ],
})
export class AppModule {}
```

### 2. Configure Middleware

```typescript
import { Module, NestModule, MiddlewareConsumer, Inject } from '@nestjs/common';
import { FedifyModule, FEDIFY_FEDERATION, integrateFederation } from 'fedify-nestjs';

@Module({
  imports: [
    FedifyModule.forRoot({
      // Federation options
    }),
  ],
})
export class AppModule implements NestModule {
  constructor(@Inject(FEDIFY_FEDERATION) private federation: any) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(integrateFederation(this.federation, async (req, res) => {
        // Context data factory
        return { req, res };
      }))
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

### 3. Register Federation Handlers

```typescript
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { FEDIFY_HANDLER_SETUP, FedifyHandlerSetup } from 'fedify-nestjs';

@Injectable()
export class FederationService implements OnModuleInit {
  constructor(
    @Inject(FEDIFY_HANDLER_SETUP) private handlerSetup: FedifyHandlerSetup,
  ) {}

  async onModuleInit() {
    this.handlerSetup.registerHandlers({
      actorDispatcher: this.handleActor.bind(this),
      nodeInfoDispatcher: this.handleNodeInfo.bind(this),
      // ... other handlers
    });
  }

  async handleActor(ctx: any, handle: string) {
    // Return actor data
  }

  async handleNodeInfo(ctx: any) {
    // Return NodeInfo data
  }
}
```

## Features

- ✅ Easy integration with NestJS dependency injection
- ✅ Full TypeScript support
- ✅ Modular handler registration
- ✅ Express middleware compatibility
- ✅ Context data factory for request-scoped data
- ✅ Support for all Fedify features

## API Reference

### FedifyModule

The main module that provides Fedify integration.

- `forRoot(options)` - Initialize with static options
- `forRootAsync(options)` - Initialize with dynamic options

### Injection Tokens

- `FEDIFY_FEDERATION` - The Fedify federation instance
- `FEDIFY_OPTIONS` - The module options
- `FEDIFY_HANDLER_SETUP` - Handler registration service

### Functions

- `integrateFederation(federation, contextFactory)` - Create Express middleware

## License

MIT