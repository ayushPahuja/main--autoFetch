import {
    Controller,
    Query,
    Get,
    Post,
    Res,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import {
    SocialInfoDto,
    DeleteSocialDto,
    AddSocialInfoDto,
    CheckSocialDto,
} from './linkSocials.dtos';
import { LinkSocialsService } from './linkSocials.service';
import { JwtAuthGuard } from '@modules/authentication/guards';

@ApiBearerAuth()
@ApiTags('linksocial')
@Controller('linksocial')
export class LinkSocialsController {
    constructor(private linkSocialsService: LinkSocialsService) {}

    @Get('/discordinfo')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Discord info' })
    async discordInfo(): Promise<SocialInfoDto> {
        try {
            return await this.linkSocialsService.getDiscordInfo();
        } catch (err) {
            console.log('error in discord info', err);
        }
    }

    @Get('/discord')
    @ApiOperation({ summary: 'Connect Users Discord' })
    async discordOauth(@Query() query: any, @Res() res: any): Promise<any> {
        const response = await this.linkSocialsService.connectDiscord(
            query.code,
            query.state,
            query.error
        );
        if (response) {
            return res.redirect(`/${response}`);
        }
    }

    @Delete('/discord')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'Disconnect Users Discord... params to pass = ?user_id=<useid>',
    })
    async discordOauthDelete(
        @Query() query: any,
        @Res() res: any
    ): Promise<DeleteSocialDto> {
        try {
            const response = await this.linkSocialsService.deleteDiscord(
                query.user_id
            );
            if (response && response.response === 'Deleted') {
                return res.status(200).send(response);
            } else {
                return res.status(404).send(response);
            }
        } catch (err) {
            console.log('error in disconnect discord', err);
        }
    }

    @Get('/twitterinfo')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Twitter info' })
    async twitterInfo(): Promise<SocialInfoDto> {
        try {
            return await this.linkSocialsService.getTwitterInfo();
        } catch (err) {
            console.log('error in twitter info', err);
        }
    }

    @Get('/twitter')
    @ApiOperation({ summary: 'Connect Users Twitter' })
    async twitterOauth(@Query() query: any, @Res() res: any): Promise<any> {
        const response = await this.linkSocialsService.connectTwitter(
            query.code,
            query.state,
            query.error
        );
        if (response) {
            return res.redirect(`/${response}`);
        }
    }

    @Delete('/twitter')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'Disconnect Users Twitter... params to pass = ?user_id=<useid>',
    })
    async twitterOauthDelete(
        @Query() query: any,
        @Res() res: any
    ): Promise<DeleteSocialDto> {
        try {
            const response = await this.linkSocialsService.deleteTwitter(
                query.user_id
            );
            if (response && response.response === 'Deleted') {
                return res.status(200).send(response);
            } else {
                return res.status(404).send(response);
            }
        } catch (err) {
            console.log('error in disconnect twitter', err);
        }
    }

    @Get('/twitterurl')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'Endpoint for devs: get twitter url... params to pass = ?user_id=<user_id>',
    })
    async twitterurl(@Query() query: any): Promise<any> {
        try {
            const response = await this.linkSocialsService.twitterurl(
                query.user_id
            );
            if (response) {
                return response;
            }
        } catch (err) {
            console.log('error in twitter url', err);
        }
    }

    @Post('/addoauthinfo')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Populate oAuth table with Discord and Twitter data',
    })
    @ApiBody({
        type: AddSocialInfoDto,
        examples: {
            valid: {
                value: {
                    provider: 'DISCORD',
                    client_id: '1040342735967748206',
                    client_secret: '63w3zrxEYELpGiv83PCM-NCCTN1TH_Ec',
                    server_url: 'http://localhost:3000/linksocial/discord',
                    scopes: 'identify&guilds.join',
                    provider_url: 'https://discord.com/oauth2/authorize',
                },
            },
        },
    })
    async addoauthinfo(
        @Body() payload: AddSocialInfoDto,
        @Res() res: any
    ): Promise<any> {
        try {
            const response = await this.linkSocialsService.addoauthinfo(
                payload
            );
            if (response && response === 'success') {
                return res.status(200).send({ message: response });
            } else {
                return res.status(404).send({ message: response });
            }
        } catch (err) {
            console.log('error in add oauth info', err);
        }
    }

    @Get('/socialcheck')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'checking to see if user has connected his twitter... params to pass = ?user_id=<user_id>&social=<discord || twitter>',
    })
    async socialcheck(@Query() query: any): Promise<CheckSocialDto> {
        try {
            const response: any = await this.linkSocialsService.socialcheck(
                query.user_id,
                query.social
            );
            if (response) {
                return response;
            }
        } catch (err) {
            console.log('error in social check', err);
        }
    }
}
