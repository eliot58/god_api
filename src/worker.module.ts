import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CronModule } from './cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, authConfig]
    }),
    ScheduleModule.forRoot(),
    CronModule
  ]
})
export class WorkerModule {}
