import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class RegisterUserRequestDto {
    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    countryCode: string;
}

export class UpdateUserEmailRequestDto {
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}

export class ResendUserRequestDto {
    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    countryCode: string;
}

export class RegisterUserResponseDto {
    authCode: string;
    isNewUser: boolean;
}

export class ResendUserResponseDto {
    authCode: string;
    isNewUser: boolean;
}
