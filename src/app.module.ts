import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CronModule } from './cron/cron.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, authConfig]
    }),
    JwtModule.registerAsync({
      inject: [appConfig.KEY],
      global: true,
      useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
        secret: appCfg.jwt_secret,
      }),
    }),
    AuthModule,
    UserModule,
    CronModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
