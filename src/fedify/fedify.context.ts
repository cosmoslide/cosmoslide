import { Request, Response } from 'express';
import { DataSource } from 'typeorm';

export interface FedifyContext {
  request: Request;
  response: Response;
  dataSource: DataSource;
  services: Map<string, any>;
}

export interface FedifyContextFactory {
  createContext(req: Request, res: Response): Promise<FedifyContext> | FedifyContext;
}