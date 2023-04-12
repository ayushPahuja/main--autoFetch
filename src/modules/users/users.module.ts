import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthenticationService } from '@modules/authentication/authentication.service';
import { UsersService } from './users.service';
import { S3Service } from '@modules/s3/s3.service';
import { WhitelistsService } from './whitelists.service';
import { GupshupModule } from '@modules/gupshup/gupshup.module';

@Module({
    imports: [forwardRef(() => AuthenticationModule), GupshupModule],
    providers: [S3Service, UsersService, WhitelistsService, AuthenticationService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}
