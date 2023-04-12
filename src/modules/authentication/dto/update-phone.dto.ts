import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePhoneRequestDto {
    @IsNotEmpty()
    @IsString()
    oldPhoneNumber: string;

    @IsNotEmpty()
    @IsString()
    newPhoneNumber: string;
}

export class UpdatePhoneResponseDto {
    authCode: number;
}

export class UpdateUserEmailResponseDto {
    authCode: number;
}
