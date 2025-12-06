import type { User } from '../entities/user.entity';

declare global {
  namespace Express {
    interface User
      extends Omit<import('../entities/user.entity').User, never> {}
    interface Request {
      user?: User;
    }
  }
}

export {};
