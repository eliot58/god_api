import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TonModule } from '../ton/ton.module';

@Module({
  imports: [
    PrismaModule,
    TonModule.forRootAsync(),
  ],
  providers: [CronService]
})
export class CronModule {}
