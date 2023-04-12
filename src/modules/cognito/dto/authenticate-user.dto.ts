export class AuthenticateUserDto {
    username: string;
}

export class AuthenticateUserOutputDto {
    idToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}
