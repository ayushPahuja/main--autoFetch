import { JwtAuthGuard } from '@modules/authentication/guards';

import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollegesList, ErrorDto } from './colleges.dtos';
import { CollegesService } from './colleges.service';

@ApiBearerAuth()
@ApiTags('colleges')
@Controller('colleges')
export class CollegesController {
    constructor(
        private CollegesService: CollegesService,
    ) {}

    // we are not using this now and we have made text entry for college name for now - Aayush Sharma[feature/WBAP-111/WBAP-112]

    @Get('/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all colleges' })
    async getColleges(): Promise<CollegesList| ErrorDto> {
        try {
            return await this.CollegesService.getColleges();
        } catch (err) {
            console.log('error in get colleges list', err);
            return {
                // @ts-ignore
                ...err,
            };
        }
    }
}