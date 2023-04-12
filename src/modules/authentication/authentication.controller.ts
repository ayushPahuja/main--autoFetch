import { CurrentUser } from '@modules/authentication/decorators';
import { JwtAuthGuard } from '@modules/authentication/guards';
import { CurrentUserDto } from '@modules/users/users.dtos';
import {
    Body,
    Controller,
    Get,
    HttpException,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { throwError } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import {
    ErrorDto,
    RegisterUserRequestDto,
    RegisterUserResponseDto,
    ResendUserRequestDto,
    ResendUserResponseDto,
    UpdatePhoneRequestDto,
    UpdatePhoneResponseDto,
    UpdateUserEmailRequestDto,
    VerifyUserRequestDto,
    VerifyUserResponseDto,
} from './dto';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
    constructor(private authenticationService: AuthenticationService) {}

    @Post('/verify')
    @ApiOperation({
        summary: 'Use the OTP number to verify and retrieve the bearer token',
    })
    @ApiBody({
        type: VerifyUserRequestDto,
        examples: {
            valid: {
                value: {
                    phone_number: '9843576966',
                    countryCode: '+91',
                    authCode: 123456,
                    otp: 268728
                },
            },
        },
    })
    async login(
        @Body() request: VerifyUserRequestDto
    ): Promise<VerifyUserResponseDto | ErrorDto> {
        try {
            return await this.authenticationService.verifyOtp(request);
        } catch (err) {
            console.log('error in login', JSON.stringify(err));
            // @ts-ignore
            throw new HttpException(err, err.status)
        }
    }

    @Post('/register')
    @ApiOperation({
        summary: 'Register and receive an OTP code to login after',
    })
    @ApiBody({
        type: RegisterUserRequestDto,
        examples: {
            valid: {
                value: { phone_number: '9843576966', countryCode: '+91' },
            },
        },
    })
    async register(
        @Body() request: RegisterUserRequestDto
    ): Promise<RegisterUserResponseDto> {
        try {
            return await this.authenticationService.register(request);
        } catch (err) {
            console.log('error in register', err);
        }
    }

    @Post('/resend')
    @ApiOperation({
        summary: 'Resend the OTP code to login after',
    })
    @ApiBody({
        type: ResendUserRequestDto,
        examples: {
            valid: {
                value: { phone_number: '7912345678', countryCode: '+44' },
            },
        },
    })
    async resend(
        @Body() request: ResendUserRequestDto
    ): Promise<ResendUserResponseDto> {
        try {
            return await this.authenticationService.resend(request);
        } catch (err) {
            console.log('error in resend', err);
        }
    }

    @Post('/phone/update')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update the phone number' })
    @ApiBody({
        type: RegisterUserRequestDto,
        examples: {
            valid: {
                value: {
                    oldPhoneNumber: '+55123456',
                    newPhoneNumber: '+55654321',
                },
            },
        },
    })
    async updatePhoneNumber(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() request: UpdatePhoneRequestDto
    ): Promise<UpdatePhoneResponseDto> {
        try {
            return await this.authenticationService.updatePhone(
                currentUser.userId,
                request
            );
        } catch (err) {
            console.log('error in update phone number', err);
        }
    }

    @Post('/email/update')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update the email' })
    @ApiBody({
        type: UpdateUserEmailRequestDto,
        examples: {
            valid: {
                value: {
                    email: 'user@email.com',
                },
            },
        },
    })
    async updateUserEmail(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() request: UpdateUserEmailRequestDto
    ): Promise<UpdatePhoneResponseDto> {
        try {
            return await this.authenticationService.updateEmail(
                currentUser.userId,
                request
            );
        } catch (err) {
            console.log('error in update email', err);
        }
    }

    @Get('token/refresh')
    @ApiOperation({ summary: "get user's refresh token" })
    async getRefreshToken(
        @Query('refresh_token') refresh_token
    ): Promise<VerifyUserResponseDto> {
        return await this.authenticationService.createAccessTokenFromRefreshToken(
            {
                refresh_token,
            }
        );
    }
}
