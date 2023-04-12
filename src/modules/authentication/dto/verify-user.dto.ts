import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyUserRequestDto {
    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    countryCode: string;

    @IsNotEmpty()
    @IsNumber()
    authCode: number;

    @IsNotEmpty()
    @IsNumber()
    otp: number;

    fcmToken?: string;
    deviceId?: string;
    deviceType?: string;
}

export class VerifyUserResponseDto {
    idToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}

export class ErrorDto {
    success: boolean;
    code: number;
    text: string;
}
