import { S3Module } from '@modules/s3/s3.module';
import { UsersModule } from '@modules/users/users.module';
import { UsersService } from '@modules/users/users.service';
import { WhitelistsService } from '@modules/users/whitelists.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OfframpController } from './offramp.controller';
import { OfframpService } from './offramp.service';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { AuthenticationService } from '@modules/authentication/authentication.service';
import { GupshupModule } from '@modules/gupshup/gupshup.module';


@Module({
    imports: [HttpModule, S3Module, UsersModule, TransactionsModule, GupshupModule],
    providers: [OfframpService, UsersService, WhitelistsService, TransactionsService, AuthenticationService],
    controllers: [OfframpController],
})
export class OfframpModule { }
