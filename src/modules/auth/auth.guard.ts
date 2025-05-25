/* eslint-disable prettier/prettier */
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { validateUser } from 'src/shared/services/helper';
@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const request: any = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');
        
        const token = authHeader.split(' ')[1];
        const payload = await this.getTokenPayload(token);
        request.user = payload;
        console.log('payload', payload);
        this.logger.log('JWT payload validated', JSON.stringify(payload));
        return true;
    }

    async getTokenPayload(token: string) {
        try {
            const secretKey = process.env.JWT_SECRET_KEY;

            if (!secretKey) throw new UnauthorizedException('JWT secret not configured');

            const keyBytes = Buffer.from(secretKey, 'base64');
            const payload = jwt.verify(token, keyBytes, { algorithms: ['HS256'] });
            console.log("payload : " , payload );
            if (!payload?.sub) throw new UnauthorizedException('Invalid token payload: missing sub');
            const email = typeof payload.sub === 'function' ? payload.sub() : payload.sub;
            const query = await validateUser([email], this.entityManager);
            if (!query) throw new UnauthorizedException('user not found');
            
            return payload;

        } catch (error) {
            console.error('JWT verification error:', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

}