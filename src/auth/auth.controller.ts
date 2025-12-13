import { Body, Controller, HttpCode, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitDataAuthGuard } from './auth.guard';
import { RequestWithAuth } from './auth.types';
import { ZodValidationPipe } from '../pipes/zod-validation.pipes';
import { CheckProofRequest, CheckProofRequestDto } from './dto/check-proof-dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @HttpCode(200)
    @Post('login')
    @UseGuards(InitDataAuthGuard)
    @UsePipes(new ZodValidationPipe(CheckProofRequest))
    async login(
        @Req() request: RequestWithAuth,
        @Body() data: CheckProofRequestDto
    ) {
        return await this.authService.login(request.tgId, data);
    }
}

