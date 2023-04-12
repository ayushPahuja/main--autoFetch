import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoModule } from '@modules/cognito/cognito.module';
import { DatabaseModule } from '@modules/database/database.module';
import { UsersModule } from '@modules/users/users.module';
import { GupshupModule } from '@modules/gupshup/gupshup.module';
import { UsersService } from '@modules/users/users.service';
import { WhitelistsService } from '@modules/users/whitelists.service';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { JwtStrategy } from './strategies';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        CognitoModule,
        forwardRef(() => UsersModule),
        DatabaseModule,
        GupshupModule
    ],
    providers: [UsersService, AuthenticationService, JwtStrategy, WhitelistsService ],
    controllers: [AuthenticationController],
    exports: [AuthenticationService],
})
export class AuthenticationModule {}
