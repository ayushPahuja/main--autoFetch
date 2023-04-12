import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { CognitoModule } from './modules/cognito/cognito.module';
import { DatabaseModule } from './modules/database/database.module';
import { SlackModule } from './modules/slack/slack.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { OfframpModule } from '@modules/offramp/offramp.module';
import { StrapiModule } from './modules/strapi/strapi.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { LinkSocialsModule } from '@modules/linkSocials/linkSocials.module';
// import { FirebaseModule } from '@modules/firebase/firebase.module';
import { GupshupModule } from '@modules/gupshup/gupshup.module';
import { CollegesModule } from '@modules/colleges/colleges.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserQuestModule } from '@modules/userQuest/userquest.module';
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SlackModule,
        CognitoModule,
        UsersModule,
        AuthenticationModule,
        WalletsModule,
        OfframpModule,
        TransactionsModule,
        LinkSocialsModule,
        StrapiModule,
        // FirebaseModule,
        GupshupModule,
        CollegesModule,
        UserQuestModule
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_INTERCEPTOR, useClass: SentryInterceptor },
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor, },
    ],
})
export class AppModule {}
