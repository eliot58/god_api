import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  tonProofPrefix: 'ton-proof-item-v2/',
  tonConnectPrefix: 'ton-connect',
  allowedDomains: ['ton-connect.github.io'],
  validAuthTimeSec: 15 * 60,
}));
