import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { DatabaseModule } from '@modules/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [TransactionsService],
    controllers: [TransactionsController],
})
export class TransactionsModule {}
