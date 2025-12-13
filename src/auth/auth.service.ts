import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CheckProofRequest, CheckProofRequestDto } from './dto/check-proof-dto';
import { PrismaService } from '../prisma/prisma.service';
import { TonService } from '../ton/ton.service';
import { AuthToken } from './jwt.interface';
import appConfig from '../config/app.config';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly ton: TonService,
        @Inject(appConfig.KEY) private readonly appCfg: ConfigType<typeof appConfig>
    ) { }

    public async generateAuthToken(
        address: string
    ): Promise<string> {
        const payload: AuthToken = { address };

        return await this.jwtService.signAsync(payload, {
            expiresIn: 60 * 60 * 24 * 7,
        });
    }

    public async login(tgId: string, body: CheckProofRequestDto) {
        const isValid = await this.ton.checkProof(body);
        if (!isValid) {
            throw new BadRequestException('Invalid proof');
        }

        const payload = body.proof.payload;

        if (payload !== tgId) throw new BadRequestException('Invalid payload')

        let user = await this.prisma.user.findUnique({
            where: { wallet_address: body.address },
        });

        if (!user) throw new NotFoundException("User not found");

        if (this.appCfg.network !== body.network) throw new BadRequestException("Invalid network");

        const token = await this.generateAuthToken(body.address);

        return { token };
    }
}
