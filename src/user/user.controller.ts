import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RequestWithAuth } from '../auth/auth.types';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Get()
	@UseGuards(JwtAuthGuard)
	async getUser(@Req() request: RequestWithAuth) {
		return await this.userService.getUser(request.address);
	}

	@Get('claims')
	@UseGuards(JwtAuthGuard)
	async getClaims(@Req() request: RequestWithAuth) {
		return await this.userService.getClaims(request.address);
	}

    @Post('claim')
	@UseGuards(JwtAuthGuard)
	async claim(@Req() request: RequestWithAuth) {
		return await this.userService.claim(request.address);
	}
}
