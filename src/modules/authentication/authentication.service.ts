import {
    DeleteItemCommand,
    GetItemCommand,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { CognitoService } from '@modules/cognito/cognito.service';
import { WhitelistsService } from '@modules/users/whitelists.service';
import { DatabaseService } from '@modules/database/database.service';
import { SlackChannels } from '@modules/slack/slack.channels';
import { SlackService } from '@modules/slack/slack.service';
import { UsersService } from '@modules/users/users.service';
import { GupshupService } from '@modules/gupshup/gupshup.service';
import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
    CreateUserDto,
    GenerateAndStoreAuthCodeAndOtpRequestDto,
    GenerateAndStoreAuthCodeAndOtpResponseDto,
    RegisterUserRequestDto,
    RegisterUserResponseDto,
    ResendUserRequestDto,
    ResendUserResponseDto,
    UpdatePhoneRequestDto,
    UpdatePhoneResponseDto,
    UpdateUserEmailRequestDto,
    UpdateUserEmailResponseDto,
    VerifyUserRequestDto,
    VerifyUserResponseDto,
} from './dto';
import { createUserMessageTokenRequestDto } from './dto/user-message-token-request.dto';
import { marshall } from '@aws-sdk/util-dynamodb';
import { OTP_MESSAGE } from '../../helpers/constants';

@Injectable()
export class AuthenticationService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly UsersService: UsersService,
        private readonly DatabaseService: DatabaseService,
        private readonly SlackService: SlackService,
        private readonly CognitoService: CognitoService,
        private readonly WhitelistsService: WhitelistsService,
        private readonly GupshupService: GupshupService,
    ) { }

    async generateAndStoreAuthCodeAndOtp({
        phone_number,
    }: GenerateAndStoreAuthCodeAndOtpRequestDto): Promise<GenerateAndStoreAuthCodeAndOtpResponseDto> {
        const SECONDS_IN_24_HOURS = 86400;
        const authCode = Math.floor(1000 + Math.random() * 9000);
        let fixedOtp = await this.WhitelistsService.getOtp(phone_number);
        let otp = fixedOtp ? fixedOtp.otp : Math.floor(100000 + Math.random() * 900000);
        const ttl = new Date().getTime() + 1000 * SECONDS_IN_24_HOURS * 7;

        const putItemCommand = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-Registration-Pins`,
            Item: {
                id: {
                    S: phone_number,
                },
                ttl: {
                    N: String(ttl),
                },
                authCode: {
                    N: String(authCode),
                },
                otp: {
                    N: String(otp),
                },
            },
        });
        await this.DatabaseService.client.send(putItemCommand);
        return { authCode, otp };
    }

    async createOrUpdateUserMessageToken({userId, deviceId, deviceType, fcmToken}:createUserMessageTokenRequestDto):Promise<boolean>{
        //get user message token details
        const getItemCommand = new GetItemCommand({
            TableName: `${process.env.NODE_ENV}-User-Message-Token`,
            Key: { userId: { S: userId }, fcmToken: {S: fcmToken} },
        });
        const result = await this.DatabaseService.client.send(getItemCommand);
        const putItemCommand = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-User-Message-Token`,
            Item: marshall({
                userId,
                fcmToken,
                deviceType,
                deviceId,
                isActive: true,
                createdAt: result.Item && result.Item.createdAt.N ? result.Item.createdAt.N : `${Date.now()}`,
                updatedAt: Date.now()

            }),
        });
        await this.DatabaseService.client.send(putItemCommand);
        return true;
    };

    async insertUserInCognito({ phone_number }: CreateUserDto): Promise<void> {
        await this.CognitoService.register({ username: phone_number });
    }

    async getUserAuthenticationCodeAndOtp(phone_number: string) {
        const getItemCommand = new GetItemCommand({
            TableName: `${process.env.NODE_ENV}-Registration-Pins`,
            Key: { id: { S: phone_number } },
        });
        const result = await this.DatabaseService.client.send(getItemCommand);
        return result.Item ?? null;
    }

    async verifyOtp(payload: VerifyUserRequestDto): Promise<VerifyUserResponseDto> {
        const {
            authCode,
            countryCode,
            otp,
            phone_number
        } = payload;
        const fullPhoneNumber = `${countryCode}${phone_number}`;
        const user = await this.UsersService.getUser({
            userId: fullPhoneNumber,
        });
        if (!user)
            throw new HttpException('No user found', HttpStatus.NOT_FOUND);

        const registrationPins = await this.getUserAuthenticationCodeAndOtp(
            fullPhoneNumber
        );

        if (
            +registrationPins.otp!.N === +otp &&
            +registrationPins.authCode!.N === +authCode &&
            registrationPins.ttl &&
            +new Date() < +registrationPins.ttl.N
        ) {
            const { accessToken, idToken, refreshToken } = await this.CognitoService.authenticate({
                username: fullPhoneNumber,
            });
            if(payload.fcmToken && payload.deviceId && payload.deviceType){
                //add fcm token data to User Message Token Table
                await this.createOrUpdateUserMessageToken({deviceId: payload.deviceId, deviceType: payload.deviceType, fcmToken: payload.fcmToken, userId: user.userId})

            }
            return { accessToken, idToken, refreshToken };
        } else {
            throw new HttpException(
                'WRONG/EXPIRED OTP',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async updatePhone(
        userId: string,
        { oldPhoneNumber, newPhoneNumber }: UpdatePhoneRequestDto
    ): Promise<UpdatePhoneResponseDto> {
        const thisUser = await this.CognitoService.getUser({
            username: oldPhoneNumber,
        });
        const exists = await this.CognitoService.userExists({
            username: newPhoneNumber,
        });

        if (!thisUser || thisUser.userId !== userId) {
            throw new HttpException(
                'Wrong phone number is provided',
                HttpStatus.METHOD_NOT_ALLOWED
            );
        }

        if (exists) {
            throw new HttpException(
                'Phone is assigned to someone else',
                HttpStatus.CONFLICT
            );
        }

        await this.insertUserInCognito({ phone_number: newPhoneNumber });

        const { authCode, otp } = await this.generateAndStoreAuthCodeAndOtp({
            phone_number: newPhoneNumber,
        });
        
        if (process.env.NODE_ENV === 'prod') {
            let re = /OTP_VALUE/gi;
            let otpMessage = OTP_MESSAGE.replace(re, `${otp}`);
            const isSend = await this.GupshupService.sendSMS({
                message: otpMessage,
                phoneNumber: newPhoneNumber,
            });
        } else {
            const slackMessageText = `Dear user (${newPhoneNumber}). Your verification code for IndiGG is ${otp}`;
            await this.SlackService.postMessageInChat({
                channel: SlackChannels.IndiGG_OTP,
                text: slackMessageText,
            });
        }

        const deleteItemCommand = new DeleteItemCommand({
            TableName: `${process.env.NODE_ENV}-Registration-Pins`,
            Key: { id: { S: oldPhoneNumber } },
        });
        await this.DatabaseService.client.send(deleteItemCommand);

        await this.CognitoService.deleteUser({ username: oldPhoneNumber });

        return { authCode: authCode };
    }

    async updateEmail(
        userId: string,
        { email }: UpdateUserEmailRequestDto
    ): Promise<UpdateUserEmailResponseDto> {
        throw new HttpException(
            'Email is assigned to someone else',
            HttpStatus.NOT_IMPLEMENTED
        );

        return { authCode: 0 };
    }

    async resend({
        countryCode,
        phone_number,
    }: ResendUserRequestDto): Promise<ResendUserResponseDto> {
        return this.register({
            countryCode,
            phone_number,
        });
    }

    async register({
        countryCode,
        phone_number,
    }: RegisterUserRequestDto): Promise<RegisterUserResponseDto> {
        const fullPhoneNumber: string = `${countryCode}${phone_number}`;
        const exists: boolean = await this.CognitoService.userExists({
            username: fullPhoneNumber,
        });

        if (!exists)
            await this.insertUserInCognito({ phone_number: fullPhoneNumber });

        const { authCode, otp } = await this.generateAndStoreAuthCodeAndOtp({
            phone_number: fullPhoneNumber,
        });
        if (process.env.NODE_ENV === 'prod') {
            let re = /OTP_VALUE/gi;
            let otpMessage = OTP_MESSAGE.replace(re, `${otp}`);
            const isSend = await this.GupshupService.sendSMS({
                message: otpMessage,
                phoneNumber: fullPhoneNumber,
            });
            if(isSend){
                return {
                    authCode: String(authCode),
                    isNewUser: !exists,
                };
            }else{
                throw new HttpException(
                    'Something Went Wrong!',
                    HttpStatus.UNPROCESSABLE_ENTITY
                );
            }
        } else {
            const slackMessageText = `Dear user (${fullPhoneNumber}). Your verification code for IndiGG is ${otp}`;
            await this.SlackService.postMessageInChat({
                channel: SlackChannels.IndiGG_OTP,
                text: slackMessageText,
            });

            return {
                authCode: String(authCode),
                isNewUser: !exists,
            };
        } 
    }

    async createAccessTokenFromRefreshToken(refresh_token): Promise<VerifyUserResponseDto>{
        try{
            const { accessToken, idToken, refreshToken } = await this.CognitoService.refresh(
                refresh_token);

            return { accessToken, idToken, refreshToken };

        }catch(error){
            console.log("error", error)
            throw new HttpException(
                'Something went wrong!',
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

    }
}
