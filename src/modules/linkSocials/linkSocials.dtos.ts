export class SocialInfoDto {
    provider: string;
    client_id: string;
    client_secret: string;
    provider_url: string;
    scopes: string;
    server_url: string;
}

export class AddSocialInfoDto {
    provider: string;
    client_id: string;
    client_secret: string;
    server_url: string;
    scopes: string;
    provider_url: string;
}

export class DeleteSocialDto {
    response: string;
}

export class CheckSocialDto {
    social_username: string
    social_id: string
    userId: string
    refress_token: string
    scope: string
    id: string
    access_token: string
    expires_at: string
}