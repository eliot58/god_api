import { registerAs } from "@nestjs/config";
import { CHAIN } from "@tonconnect/ui-react";

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV!,
    jwt_secret: process.env.JWT_SECRET!,
    tonapi_key: process.env.TONAPI_KEY!,
    tonapi_url: process.env.TONAPI_URL!,
    bot_token: process.env.BOT_TOKEN!,
    contract_address: process.env.CONTRACT_ADDRESS!,
    public_key: Buffer.from(process.env.PUBLIC_KEY!, "hex"),
    private_key: Buffer.from(process.env.PRIVATE_KEY!, "hex"),
    network: process.env.NODE_ENV! === 'development' ? CHAIN.TESTNET : CHAIN.MAINNET,
}));