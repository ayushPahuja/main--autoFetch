import { CurrentUser } from '@modules/authentication/decorators';
import { JwtAuthGuard } from '@modules/authentication/guards';
import { S3Service } from '@modules/s3/s3.service';

import {
    Body,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    NotFoundException,
    ParseFilePipe,
    Post,
    Put,
    Query,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {UserQuestDto} from './userquest.dtos';
import { UserQuestService } from './userquest.service';

@ApiBearerAuth()
@ApiTags('userquest')
@Controller('userquest')
export class UserQuestController {
    constructor(
        private UserQuestService: UserQuestService,
        private S3Service: S3Service
    ) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Dummy placeholder route' })
    async getUsers(): Promise<any> {
        try {
            return [];
        } catch (err) {
            console.log('error in get users list', err);
        }
    }

    @Get('/changestatus')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary:
            'change the status of a quest. pass as parameters (questId, action)',
    })
    async changeQuestState(
        @Query('questId') questid: string,
        @Query('action') detailtype: string,
    ): Promise<UserQuestDto> {
        const params = {
            detailType: detailtype,
            detail: { uid: questid },
        }
        try {
            const eventBusResponse = await this.UserQuestService.passEvent(params)
            return eventBusResponse;
        } catch (err) {
            console.log('err', err);
        }
    }
}
