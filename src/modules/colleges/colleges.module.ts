import { Module } from '@nestjs/common';
import { CollegesController } from './colleges.controller';
import { CollegesService } from './colleges.service';
import { DatabaseModule } from '@modules/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [CollegesService],
    controllers: [CollegesController],
})
export class CollegesModule {}
