import { Federation } from '@fedify/fedify';
import { Injectable, NestMiddleware, Type } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export type ContextDataFactory<TContextData> = (
  req: Request,
  res: Response,
) => TContextData | Promise<TContextData>;

export function integrateFederation<TContextData>(
  federation: Federation<unknown>,
  contextDataFactory: ContextDataFactory<TContextData>,
): Type<NestMiddleware> {
  @Injectable()
  class FedifyIntegrationMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
      try {
        const contextData = await contextDataFactory(req, res);

        // Convert Express request to Web API Request
        const url = new URL(req.url, `${req.protocol}://${req.get('host')}`);
        const headers = new Headers();

        // Copy headers from Express request to Web API Headers
        Object.entries(req.headers).forEach(([key, value]) => {
          if (value) {
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
        });

        // Create Web API Request
        const webRequest = new Request(url.toString(), {
          method: req.method,
          headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });

        console.log(`FedifyMiddleware: Calling federation.fetch for ${url.toString()}`);

        const response = await federation.fetch(webRequest, {
          contextData,
        });

        if (response) {
          console.log(`FedifyMiddleware: Got response with status ${response.status}`);
          response.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value);
          });
          res.status(response.status);
          const body = await response.text();
          res.send(body);
        } else {
          console.log(`FedifyMiddleware: No response from federation, passing to next`);
          next();
        }
      } catch (error) {
        console.error('FedifyMiddleware error:', error);
        next(error);
      }
    }
  }

  return FedifyIntegrationMiddleware;
}
