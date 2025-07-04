import { Injectable, Inject } from '@nestjs/common';
import { FEDIFY_FEDERATION } from 'fedify-nestjs';

@Injectable()
export class ContextService {
  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: any,
  ) {}

  /**
   * Create a context for background activity delivery
   * This is used when we need to send activities outside of an HTTP request
   */
  async createContext(baseUrl?: string): Promise<any> {
    // Use the base URL from environment or the provided one
    const origin = baseUrl || process.env.FEDERATION_ORIGIN || `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}`;
    
    // Create a minimal request-like object for context creation
    const mockRequest = {
      url: '/',
      headers: {
        host: new URL(origin).host,
      },
      method: 'POST',
      protocol: new URL(origin).protocol.replace(':', ''),
      get: (header: string) => {
        if (header.toLowerCase() === 'host') {
          return new URL(origin).host;
        }
        return mockRequest.headers[header.toLowerCase()];
      },
    };

    // Create the context using the federation's context loader
    // The exact implementation depends on how fedify-nestjs handles this
    // For now, we'll return the federation object which should have the necessary methods
    return {
      ...this.federation,
      url: new URL(origin),
      request: mockRequest,
      // The sendActivity method should be available on the federation object
      sendActivity: this.federation.sendActivity?.bind(this.federation),
      getActor: this.federation.getActor?.bind(this.federation),
      getActorUri: (handle: string) => new URL(`${origin}/actors/${handle}`),
      getInboxUri: (handle: string) => new URL(`${origin}/actors/${handle}/inbox`),
      getOutboxUri: (handle: string) => new URL(`${origin}/actors/${handle}/outbox`),
      getFollowersUri: (handle: string) => new URL(`${origin}/actors/${handle}/followers`),
      getFollowingUri: (handle: string) => new URL(`${origin}/actors/${handle}/following`),
    };
  }
}