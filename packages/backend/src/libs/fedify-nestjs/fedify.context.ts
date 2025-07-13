import { Request, Response } from 'express';

export interface FedifyContext {
  request: Request;
  response: Response;
  services: Map<string, any>;
}

export interface FedifyContextFactory {
  createContext(req: Request, res: Response): Promise<FedifyContext> | FedifyContext;
}
