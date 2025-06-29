import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FEDIFY_FEDERATION } from './fedify.constants';
import { ContextDataFactory } from './integrate-federation';

@Injectable()
export class FedifyMiddleware implements NestMiddleware {
  constructor(
    @Inject(FEDIFY_FEDERATION) private readonly federation: any,
    private readonly contextDataFactory: ContextDataFactory<any> = () => undefined,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const contextData = await this.contextDataFactory(req, res);
      
      const response = await this.federation.fetch(req as any, {
        contextData,
      });

      if (response) {
        response.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });
        res.status(response.status);
        const body = await response.text();
        res.send(body);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  }
}