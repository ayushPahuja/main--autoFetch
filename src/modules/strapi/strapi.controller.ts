import {
    Controller,
    Get,
    NotFoundException,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    strapiFooter,
    strapiHeaderSliders,
    strapiHomeSection2,
    strapiQuestsLists,
    strapiTournamentslists,
    strapiGameLists,
    strapiWikiLists
} from './strapi.dtos';
import { StrapiService } from './strapi.service';

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL!;

@ApiBearerAuth()
@ApiTags('strapi')
@Controller('strapi')
export class StrapiController {
    constructor(
        private StrapiService: StrapiService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Dummy placeholder route' })
    async getUsers(): Promise<any> {
        try {
            return [];
        } catch (err) {
            console.log('error in get users list', err);
        }
    }

    @Get('/data')
    @ApiOperation({ summary: 'Get strapi data: e.g ?url=api/footers?populate=*&endpoint=footers --watch endpoints.txt for all the params' })
    async getProfile(
        @Query('url') url: string,
        @Query('endpoint') endpoint: string,
    ): Promise<
        strapiFooter | 
        strapiHeaderSliders | 
        strapiHomeSection2 | 
        strapiQuestsLists |
        strapiTournamentslists | 
        strapiGameLists |
        strapiWikiLists>{
        try {
            const result = await this.StrapiService.strapiGetData(`${STRAPI_BASE_URL}${url}`, endpoint);
            if (!result) throw new NotFoundException();
            return result;
        } catch (err) {
            console.log('error in get user profile', err);
        }
    }
}
