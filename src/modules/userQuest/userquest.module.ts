import { Module } from '@nestjs/common';
import { UserQuestController } from './userquest.controller';
import { UserQuestService } from './userquest.service';
import { S3Service } from '@modules/s3/s3.service';

@Module({
    providers: [S3Service, UserQuestService,],
    controllers: [UserQuestController],
})
export class UserQuestModule {}