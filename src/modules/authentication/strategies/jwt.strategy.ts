import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CognitoService } from '@modules/cognito/cognito.service';
import { CognitoConfig } from '@modules/cognito/cognito.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly cognitoService: CognitoService,
        private readonly cognitoConfig: CognitoConfig
    ) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${cognitoConfig.authority}/.well-known/jwks.json`,
            }),
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: cognitoConfig.authority,
        });
    }

    async validate(payload: any) {
        if (!payload.sub || !payload.username) return null;
        const user = await this.cognitoService.getUser({
            username: payload.username,
        });

        return {
            ...user,
            accessToken: payload,
        };
    }
}
