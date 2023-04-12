import { Module } from '@nestjs/common';
import { StrapiController } from './strapi.controller';
import { StrapiService } from './strapi.service';

@Module({
    providers: [StrapiService],
    controllers: [StrapiController],
})
export class StrapiModule {}
