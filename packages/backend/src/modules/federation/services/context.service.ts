import { Injectable, Inject } from '@nestjs/common';
import { Federation, Context } from '@fedify/fedify';
import { FEDIFY_FEDERATION } from '@fedify/nestjs';

@Injectable()
export class ContextService {
  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
  ) {}

  /**
   * Create a federation context for background activity delivery.
   * Used when sending activities outside of an HTTP request context.
   */
  createContext(): Context<unknown> {
    const origin =
      process.env.FEDERATION_ORIGIN ||
      `${process.env.FEDERATION_PROTOCOL}://${process.env.FEDERATION_DOMAIN}`;

    return this.federation.createContext(new URL(origin), undefined);
  }
}
