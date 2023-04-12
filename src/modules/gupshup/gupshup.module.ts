import { Module } from '@nestjs/common';
import { GupshupService } from './gupshup.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [GupshupService],
    exports: [GupshupService],
})
export class GupshupModule {}
