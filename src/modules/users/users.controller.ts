import { CurrentUser } from '@modules/authentication/decorators';
import { JwtAuthGuard } from '@modules/authentication/guards';
import { S3Service } from '@modules/s3/s3.service';

import {
    Body,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    NotFoundException,
    Param,
    ParseFilePipe,
    Post,
    Put,
    Query,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    HttpException,
    HttpStatus,
    ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FILE_SIZE } from 'src/helpers/constants';
import {
    AddUserContactRequestDto,
    checkEmailAvailabilityResponseDto,
    CurrentUserDto,
    ErrorDto,
    getProfessionsResponseDto,
    GetUserProfileResponseDto,
    GetUserWalletOutputDto,
    UpdateEmail,
    UpdateUserAvatarResponseDto,
    UpdateUsernameOrEmailRequestDto,
    UpdateUsernameOrEmailResponseDto,
    UpdateUserProfileRequestDto,
    UpdateUserWalletPrivkeyRequestDto,
    UpdateUserWalletRequestDto,
    UserContactList,
    UserEmail,
    UserPhoneDto,
} from './users.dtos';
import { UsersService } from './users.service';
import { verifyEmailHelper } from './verifyEmailHelper';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private UsersService: UsersService,
        private S3Service: S3Service
    ) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Dummy placeholder route' })
    async getUsers(): Promise<any> {
        try {
            return [];
        } catch (err) {
            console.log('error in get users list', err);
        }
    }

    @Get('/me/profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<GetUserProfileResponseDto> {
        try {
            const result = await this.UsersService.getUserProfile({
                userId: currentUser.userId,
            });
            if (!result) throw new NotFoundException();
            result.phone_number = currentUser.phone_number;
            return result;
        } catch (err) {
            console.log('error in get user profile', err);
        }
    }

    @Put('/me/profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Update current user's profile" })
    @ApiBody({
        type: UpdateUserProfileRequestDto,
        examples: {
            valid: {
                value: {
                    playertag: '0xL00t',
                    name: 'Will Smith',
                    discord: '..',
                    twitter: '..',
                    steam: '..',
                    address: 'address',
                    gender: 'gender',
                    graduationYear: '1994',
                    gamerType: 'gamer type',
                    collegeName: 'college name',
                    firstName: 'first name',
                    lastName: 'last name',
                    profession: 'profession',
                    username: 'username',
                    email: 'email',
                },
            },
        },
    })
    async updateProfile(
        @Body() payload: UpdateUserProfileRequestDto,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<boolean> {
        try {
            return await this.UsersService.updateUserProfile(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in update user profile', err);
        }
    }

    @Post('/me/profile/picture')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a profile picture for the user' })
    async uploadProfilePicture(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'jpeg',
                })
                .addMaxSizeValidator({
                    maxSize: FILE_SIZE * Math.pow(2, 20) /* 15Mb */,
                })
                .build({
                    exceptionFactory(error) {
                        throw new HttpException(
                            'Size of image should be less than 15 mb',
                            HttpStatus.BAD_REQUEST
                        );
                    },
                })
        )
        file: Express.Multer.File,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UpdateUserAvatarResponseDto> {
        try {
            const dateString = Date.now();
            const uploadResult = await this.S3Service.upload(
                `${process.env.NODE_ENV}-profilepictures-bucket`,
                `/profile/picture/${currentUser.userId}/${dateString}.jpeg`,
                file.buffer
            );

            return await this.UsersService.updateUserAvatar(
                { userId: currentUser.userId },
                { imageUrl: uploadResult.Location }
            );
        } catch (err) {
            console.log('error in upload profile picture', err);
        }
    }

    @Get('/me/contacts')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Get a list the user's list of contacts" })
    async getContacts(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UserContactList> {
        try {
            const result = await this.UsersService.getUserContacts({
                userId: currentUser.userId,
            });
            if (!result) return [];
            return result;
        } catch (err) {
            console.log('error in getting user contacts list', err);
        }
    }

    @Put('/me/contacts')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Add a contact to user's contact list" })
    @ApiBody({
        type: UserPhoneDto,
        examples: {
            valid_phone_number: { value: { phone_number: '+971237894..' } },
        },
    })
    async addContacts(
        @Body() payload: AddUserContactRequestDto,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<boolean> {
        try {
            return await this.UsersService.addUserContact(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in adding user contact', err);
        }
    }

    @Get('/me/wallet/address')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "get user's wallet address" })
    async getUserWalletAddress(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<GetUserWalletOutputDto> {
        try {
            const result = await this.UsersService.getUserWalletAddress({
                userId: currentUser.userId,
            });
            return result;
        } catch (err) {
            console.log('error in get user wallet', err);
        }
    }

    @Get('/me/wallet/privkey')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "get user's wallet privkey" })
    async getUserWalletPrivkey(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<GetUserWalletOutputDto> {
        try {
            const result = await this.UsersService.getUserWalletPrivkey({
                userId: currentUser.userId,
            });
            return result;
        } catch (err) {
            console.log('error in get user wallet private key', err);
        }
    }

    @Put('/me/wallet/address')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Associate a user with their wallet' })
    @ApiBody({
        type: UpdateUserWalletRequestDto,
        examples: { valid: { value: { address: '0xabc123..' } } },
    })
    async addWalletAddress(
        @Body() payload: UpdateUserWalletRequestDto,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<boolean> {
        try {
            return await this.UsersService.updateUserWallet(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in update user wallet address', err);
        }
    }

    @Put('/me/wallet/privkey')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Store the private key of the user's wallet" })
    @ApiBody({
        type: UpdateUserWalletPrivkeyRequestDto,
        examples: {
            valid: { value: { address: '0xabc123..', privkey: '0xabc123..' } },
        },
    })
    async addWalletPrivKey(
        @Body() payload: UpdateUserWalletPrivkeyRequestDto,
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<boolean> {
        try {
            return await this.UsersService.updateUserWalletPrivkey(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in adding user wallet private key', err);
        }
    }

    @Post('/me/verify/email')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'User Adds email and we sent a verification email.. we pass in body the email and the userId, and the platform(website or wallet)',
    })
    @ApiBody({
        type: UserEmail,
        examples: {
            valid: {
                value: {
                    email: 'xyz@domain.com',
                    userId: '8167c5a0-863b-4752-b296-121b6c9bd36a',
                    platform: 'website || wallet',
                },
            },
        },
    })
    async verifyEmail(
        @Body() payload: UpdateEmail,
        @Req() req
    ): Promise<boolean | string> {
        try {
            if (!payload) {
                throw new NotFoundException('Email id not found');
            } else {
                const host = req.get('host') + req.url;
                const serverUrl = req.get('host');
                return await this.UsersService.verifyEmail(
                    payload,
                    host,
                    serverUrl
                );
            }
        } catch (err) {
            console.log('error in verify email', err);
        }
    }

    @Get('/me/verify/email')
    @ApiOperation({
        summary:
            'The Api that user gets redirected after clicking the verification link in the email.. here we expect as parameters the userId, the timestamp and the platform (website or wallet))',
    })
    async isEmailVerified(
        @Query('id') id: string,
        @Query('date') date: number,
        @Query('platform') platform: string,
        @Req() req,
        @Res() res
    ): Promise<string> {
        const response = await this.UsersService.isEmailVerified(
            id,
            date,
            platform
        );
        // const host = req.get('host') + req.url;
        const serverUrl = req.get('host');
        if (response) {
            if (req.header('user-agent').indexOf('Mobile') != -1) {
                return res.send(
                    verifyEmailHelper(response, platform, serverUrl, 'mobile')
                );
            } else {
                return res.send(
                    verifyEmailHelper(response, platform, serverUrl, 'desktop')
                );
            }
        }
    }

    @Get('/me/attributes')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'Getting cognito object.. this has in all the cognito attributes.. we passing userId as param ?id=<userId>',
    })
    async getCognitodata(@Query('id') id: string): Promise<string> {
        try {
            return await this.UsersService.getCognitodata(id);
        } catch (err) {
            console.log('error in cognito attributes', err);
        }
    }

    @Get('/me/username')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'check username availability',
    })
    async checkUsername(@Query('username') username: string): Promise<boolean> {
        try {
            return await this.UsersService.checkUsernameAvailability(username);
        } catch (err) {
            console.log('error in cognito attributes', err);
        }
    }

    @Get('/me/email')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'check email availability',
    })
    async checkEmail(
        @Query('email') email: string
    ): Promise<checkEmailAvailabilityResponseDto> {
        try {
            return await this.UsersService.checkEmailAvailability(email);
        } catch (err) {
            console.log('error in cognito attributes', err);
        }
    }

    @Put('/me/username')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'send otp for update username',
    })
    async sendOtpForUsernameUpdate(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UpdateUsernameOrEmailResponseDto> {
        try {
            return await this.UsersService.sendOtpForUpdateUsernameOrEmail({
                userId: currentUser.userId,
            });
        } catch (err) {
            console.log('error in update username', err);
        }
    }

    @Put('/me/email')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'send otp for update email',
    })
    async sendOtpForEmailUpdate(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UpdateUsernameOrEmailResponseDto> {
        try {
            return await this.UsersService.sendOtpForUpdateUsernameOrEmail({
                userId: currentUser.userId,
            });
        } catch (err) {
            console.log('error in update email', err);
        }
    }

    @Put('/me/verify-username')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'update username' })
    @ApiBody({
        type: UpdateUsernameOrEmailRequestDto,
        examples: {
            valid: {
                value: {
                    username: 'username',
                    otp: 123456,
                    authCode: 1234,
                },
            },
        },
    })
    async updateUsername(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() payload: UpdateUsernameOrEmailRequestDto
    ): Promise<boolean | ErrorDto> {
        try {
            return await this.UsersService.updateUsernameOrEmail(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in updating username', JSON.stringify(err));
            // @ts-ignore
            throw new HttpException(err, err.status);
        }
    }

    @Put('/me/verify-email')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'update email' })
    @ApiBody({
        type: UpdateUsernameOrEmailRequestDto,
        examples: {
            valid: {
                value: {
                    email: 'email@indi.gg',
                    otp: 123456,
                    authCode: 1234,
                },
            },
        },
    })
    async updateEmail(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() payload: UpdateUsernameOrEmailRequestDto
    ): Promise<boolean | ErrorDto> {
        try {
            return await this.UsersService.updateUsernameOrEmail(
                { userId: currentUser.userId },
                payload
            );
        } catch (err) {
            console.log('error in updating email', JSON.stringify(err));
            // @ts-ignore
            throw new HttpException(err, err.status);
        }
    }

    @Get('/me/professions')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'get professions list',
    })
    async getProfessions(): Promise<getProfessionsResponseDto> {
        try {
            return await this.UsersService.getProfessions();
        } catch (err) {
            console.log('error in getting professions list', err);
        }
    }
}
