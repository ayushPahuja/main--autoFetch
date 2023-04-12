export class GetUserInputDto {
    username: string;
}

export class GetUserDto {
    sub: string;
    userId: string;
    phone_number: string;
    username: string;
    whitelist?: boolean;
}
