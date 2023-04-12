export class GenerateAndStoreAuthCodeAndOtpRequestDto {
    phone_number: string;
}

export class GenerateAndStoreAuthCodeAndOtpResponseDto {
    authCode: number;
    otp: number;
}
