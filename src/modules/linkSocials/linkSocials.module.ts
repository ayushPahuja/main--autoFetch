import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LinkSocialsController } from './linkSocials.controller';
import { LinkSocialsService } from './linkSocials.service';

@Module({
    imports: [HttpModule],
    providers: [LinkSocialsService],
    controllers: [LinkSocialsController],
})
export class LinkSocialsModule { }
