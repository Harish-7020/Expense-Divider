import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (req.user) {
      console.log('Current User:', req.user);
    }
    next();
  }
}
