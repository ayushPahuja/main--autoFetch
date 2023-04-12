import { Injectable } from '@nestjs/common';

@Injectable()
export class CognitoConfig {
    public readonly userPoolId: string = process.env.AWS_COGNITO_USER_POOL_ID!;
    public readonly clientId: string =
        process.env.AWS_COGNITO_USER_POOL_CLIENT_ID!;
    public readonly region: string = process.env.AWS_REGION!;
    public readonly authority = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
}
