import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    BadRequestException,
    Inject,
} from '@nestjs/common';
import { isValid, parse } from '@telegram-apps/init-data-node';
import { ConfigType } from '@nestjs/config';
import { RequestWithAuth } from './auth.types';
import appConfig from '../config/app.config';
import { JwtService } from '@nestjs/jwt';
import { AuthToken } from './jwt.interface';

@Injectable()
export class InitDataAuthGuard implements CanActivate {
    constructor(@Inject(appConfig.KEY) private readonly appCfg: ConfigType<typeof appConfig>) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: RequestWithAuth = context.switchToHttp().getRequest();
        const initData = this.extractInitDataFromHeader(request);

        if (!initData) throw new UnauthorizedException('initData not provided');

        if (!isValid(initData, this.appCfg.bot_token, { expiresIn: 15 * 60 })) throw new BadRequestException("Invalid initData");

        const parsed = parse(initData);

        if (!parsed.user) throw new BadRequestException('User data is missing from initData');

        request.tgId = parsed.user.id.toString();

        return true;
    }

    private extractInitDataFromHeader(request: RequestWithAuth): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('initData ')) return null;
        return authHeader.split(' ')[1];
    }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: RequestWithAuth = context.switchToHttp().getRequest();
        const token = this.extractBearerFromHeader(request);

        if (!token) throw new UnauthorizedException('Token not provided');

        try {
            const payload: AuthToken = await this.jwtService.verifyAsync(token);
            request.address = payload.address;

        } catch (err) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return true;
    }

    private extractBearerFromHeader(request: RequestWithAuth): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        return authHeader.split(' ')[1];
    }
}