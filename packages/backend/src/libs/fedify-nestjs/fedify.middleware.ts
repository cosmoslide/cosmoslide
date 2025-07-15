import { Injectable, NestMiddleware, Inject, Type } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FEDIFY_FEDERATION } from './fedify.constants';
import { Federation } from '@fedify/fedify';

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

        const response = await federation.fetch(webRequest, {
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

  return FedifyIntegrationMiddleware;
}
