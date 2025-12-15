import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Address, Cell, beginCell } from '@ton/core';
import { ConfigType } from '@nestjs/config';
import { sign } from 'tweetnacl';
import { PrismaService } from '../prisma/prisma.service';
import appConfig from '../config/app.config';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(appConfig.KEY) private readonly appCfg: ConfigType<typeof appConfig>,
    ) { }

    public async getUser(wallet_address: string) {
        const user = await this.prisma.user.findUnique({ where: { wallet_address } });

        if (!user) throw new NotFoundException("User not found");

        return user;
    }

    public async getClaims(wallet_address: string) {
        const claims = await this.prisma.claimRequest.findMany({ where: { userWallet: wallet_address } })

        return claims;
    }

    public async claim(wallet_address: string) {
        const user = await this.prisma.user.findUnique({ where: { wallet_address } });
        if (!user) throw new NotFoundException("User not found");

        if (user.balance <= 0) {
            throw new BadRequestException("Nothing to claim today");
        }

        const secretKey = new Uint8Array(this.appCfg.private_key);

        const amount = BigInt(user.balance * 1e9);
        const beneficiary = Address.parse(wallet_address);
        const nonce = BigInt(Math.floor(Date.now()));
        const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 300);

        const signCell = (cell: Cell) => {
            const hash = cell.hash();
            const sig = sign.detached(hash, secretKey);
            return Buffer.from(sig);
        };

        const signedDataCell = beginCell()
            .storeCoins(amount)
            .storeAddress(beneficiary)
            .storeUint(nonce, 64)
            .storeUint(expiredAt, 64)
            .endCell();

        const sigBuf = signCell(signedDataCell);

        const body = beginCell()
            .storeUint(3162217313, 32)
            .storeBuffer(sigBuf)
            .storeRef(signedDataCell)
            .endCell();

        await this.prisma.claimRequest.create({
            data: {
                userWallet: wallet_address,
                amount: user.balance,
                signature: sigBuf.toString("hex")
            },
        })

        await this.prisma.user.update({
            where: { wallet_address },
            data: { balance: 0 },
        })

        return {
            payload: body.toBoc().toString('base64'),
            address: this.appCfg.contract_address
        }
    }
}
