import { Injectable, Inject } from '@nestjs/common';
import { FEDIFY_FEDERATION } from '../../../libs/fedify-nestjs';

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
    
    // Create a Web API Request object as Fedify expects
    const url = new URL('/', origin);
    const headers = new Headers();
    headers.set('host', url.host);
    
    const webRequest = new Request(url.toString(), {
      method: 'POST',
      headers,
    });

    // Create context data similar to what the middleware creates
    const contextData = {
      dataSource: null,
      url,
    };

    // Use the federation's fetch method to create a proper context
    // This simulates an incoming request which will create the context internally
    const response = await this.federation.fetch(webRequest, { contextData });
    
    // The federation should now have created an internal context
    // Create a context object that properly binds methods while maintaining access to origin
    const federationContext = {
      origin: url.origin,
      url,
      request: webRequest,
      data: contextData,
      // Bind sendActivity with the context that has origin
      sendActivity: async function(sender: any, recipients: any, activity: any, options?: any) {
        // 'this' will refer to federationContext which has origin
        return await this.federation.sendActivity.call(this, sender, recipients, activity, options);
      },
      getActor: this.federation.getActor?.bind(this.federation),
      getActorUri: (handle: string) => new URL(`${origin}/actors/${handle}`),
      getInboxUri: (handle: string) => new URL(`${origin}/actors/${handle}/inbox`),
      getOutboxUri: (handle: string) => new URL(`${origin}/actors/${handle}/outbox`),
      getFollowersUri: (handle: string) => new URL(`${origin}/actors/${handle}/followers`),
      getFollowingUri: (handle: string) => new URL(`${origin}/actors/${handle}/following`),
      // Store reference to federation
      federation: this.federation,
    };
    
    // Bind the sendActivity method to federationContext so 'this' refers to the context
    federationContext.sendActivity = federationContext.sendActivity.bind(federationContext);
    
    return federationContext;
  }
}