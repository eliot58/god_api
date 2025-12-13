import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TonApiClient, Trace } from '@ton-api/client';
import { Address } from '@ton/core';
import { PrismaService } from '../prisma/prisma.service';
import appConfig from '../config/app.config';
import { signVerify } from 'ton-crypto';

@Injectable()
export class CronService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject("TONAPI_CLIENT") private readonly tonApiClient: TonApiClient,
        @Inject(appConfig.KEY) private readonly appCfg: ConfigType<typeof appConfig>
    ) { }

    private isTraceSuccessful(trace: Trace): boolean {
        const tx = trace.transaction;

        if (trace.emulated) return false;

        if (!tx.success) return false;
        if (tx.aborted) return false;
        if (tx.computePhase?.exitCode !== 0) return false;

        if (tx.bouncePhase) return false;

        for (const child of trace.children ?? []) {
            if (!this.isTraceSuccessful(child)) {
                return false;
            }
        }

        return true;
    }


    @Cron(CronExpression.EVERY_5_MINUTES)
    async processPendingClaims() {
        const lastClaim = await this.prisma.claimRequest.findFirst({
            where: { status: "SUCCESS" },
            orderBy: { lt: 'desc' }
        });
        const after_lt = lastClaim?.lt ? BigInt(lastClaim.lt) : BigInt(0);

        const result = await this.tonApiClient.blockchain.getBlockchainAccountTransactions(
            Address.parse(this.appCfg.contract_address),
            { after_lt, sort_order: "asc", limit: 100 }
        );

        for (const tx of result.transactions) {
            const isSuccess =
                tx.success === true &&
                tx.inMsg?.opCode === 3162217313n &&
                tx.aborted === false &&
                tx.computePhase?.success === true &&
                tx.computePhase?.exitCode === 0 &&
                tx.actionPhase?.success === true;

            if (isSuccess) {
                const trace = await this.tonApiClient.traces.getTrace(tx.hash);

                if (this.isTraceSuccessful(trace)) {
                    const body = tx.inMsg?.rawBody;

                    if (body) {
                        const slice = body.beginParse()
                        slice.skip(32);
                        const signature = slice.loadBuffer(64);
                        const payload = slice.loadRef();

                        const ok = signVerify(payload.hash(), signature, this.appCfg.public_key);
                        if (ok) {
                            const claimRequest = await this.prisma.claimRequest.findUnique({
                                where: { signature: signature.toString("hex") }
                            })

                            if (claimRequest) {
                                await this.prisma.claimRequest.update({
                                    where: { id: claimRequest.id },
                                    data: {
                                        tx: tx.hash,
                                        lt: tx.lt.toString(),
                                        status: "SUCCESS"
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }
    }



    @Cron(CronExpression.EVERY_10_MINUTES)
    async expireOldClaims() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const oldClaims = await this.prisma.claimRequest.findMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: fiveMinutesAgo }
            }
        });

        for (const claim of oldClaims) {
            await this.prisma.$transaction([
                this.prisma.claimRequest.update({
                    where: { id: claim.id },
                    data: { status: 'FAILED' }
                }),
                this.prisma.user.update({
                    where: { wallet_address: claim.userWallet },
                    data: { balance: { increment: claim.amount } }
                })
            ]);
        }
    }

}
