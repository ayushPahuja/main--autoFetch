import {
    IsHexadecimal,
    IsNotEmpty,
    IsPhoneNumber,
    IsUUID,
} from 'class-validator';

export class GetUserInputDto {
    userId: string;
}
export class GetUserOutputDto {
    sub: string;
    userId: string;
    phone_number: string;
    username: string;
    whitelist?: boolean;
}

// TODO: Add accessToken object under CurrentUserDto
export class CurrentUserDto {
    sub: string;
    userId: string;
    phone_number: string;
    username: string;
}

export class WalletAddressDto {
    address: string;
}

export class UserPhoneDto {
    phone_number: string;
}

export class UsernameDto {
    userName: string;
}

export class UserEmail {
    email: string;
}

export class UpdateEmail {
    email: string;
    userId: string;
    platform: string;
}

export class UserProfile {
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;

    @IsNotEmpty()
    username: string;

    @IsPhoneNumber()
    @IsNotEmpty()
    phone_number: string;

    playertag: string;
    name: string;
    email: string;
    discord: string;
    twitter: string;
    steam: string;
    address: string;
    gender: string;
    graduationYear: string;
    gamerType: string;
    firstName: string;
    lastName: string;
    collegeName: string;
    profession: string;
}

export class UserWallet {
    @IsHexadecimal()
    @IsNotEmpty()
    address: string;
}

export class UserWalletPrivkey {
    @IsHexadecimal()
    @IsNotEmpty()
    address: string;

    @IsHexadecimal()
    @IsNotEmpty()
    privkey: string;
}

export class GetUserWalletOutputDto extends UserWallet {}
export class UpdateUserWalletRequestDto extends UserWallet {}
export class UpdateUserWalletPrivkeyRequestDto extends UserWalletPrivkey {}
export class UpdateUserWalletPrivkeyOutputDto extends UserWalletPrivkey {}

export type UserContactList = UserContact[];

export class UserContact {
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;

    @IsNotEmpty()
    userName: string;

    @IsNotEmpty()
    playertag: string;

    @IsNotEmpty()
    aliasName: string;

    @IsPhoneNumber()
    @IsNotEmpty()
    phone_number: string;

    @IsHexadecimal()
    @IsNotEmpty()
    address: string;
}

export interface AddUserContactRequestDto
    extends WalletAddressDto,
        UserPhoneDto,
        UsernameDto {}

export class GetByUserIdDto {
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;
}

export class GetUserByWalletDto {
    @IsHexadecimal()
    @IsNotEmpty()
    address: string;
}

export class GetUserByWalletOutputDto {
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;
    @IsHexadecimal()
    @IsNotEmpty()
    address: string;
}

export class GetUserProfileResponseDto extends UserProfile {
    isProfileVerified: boolean;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    createdAt: number;
    imageUrl: string;
}

export class UpdateUserProfileRequestDto {
    playertag: string;
    name: string;
    discord: string;
    twitter: string;
    steam: string;
    address: string;
    gender: string;
    graduationYear: string;
    gamerType: string;
    collegeName: string;
    firstName: string;
    lastName: string;
    profession: string;
    username: string;
    email: string;
}

export class UpdateUserAvatarRequestDto {
    imageUrl: string;
}

export class UpdateUserAvatarResponseDto {
    imageUrl: string;
}

export class UpdateUsernameOrEmailRequestDto {
    username?: string;
    email?: string;
    otp: string;
    authCode: string;
}
export class UpdateUsernameOrEmailResponseDto {
    authCode: number;
}
export class checkEmailAvailabilityResponseDto {
    isEmailExist: boolean;
    isEmailVerified: boolean;
}
export class ErrorDto {
    success: boolean;
    code: number;
    text: string;
}

export class getProfessionsResponseDto {
    professions: Array<string>;
}
