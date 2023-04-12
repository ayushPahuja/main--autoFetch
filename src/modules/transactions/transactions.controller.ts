import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/authentication/guards';
import {
    CreateTransactionRequestDto,
    UpdateUserTransactionRequestDto,
    UserTransaction,
    UserTransactionList,
    SendTransactionInputDto,
    GetTransactionOutputDto,
    ErrorDto,
} from './transactions.dtos';
import { TransactionsService } from './transactions.service';
import { CurrentUserDto } from '@modules/users/users.dtos';
import { CurrentUser } from '@modules/authentication/decorators';

@ApiBearerAuth()
@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
    constructor(private TransactionsService: TransactionsService) {}

    @Get('/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lookup transactions by user' })
    async getTransactionsByUserId(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UserTransactionList | ErrorDto> {
        try {
            return await this.TransactionsService.getUserTransactions({
                userId: currentUser.userId,
            });
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }

    @Get('/fiat')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lookup fiat history by user' })
    async getUserFiatTransactions(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UserTransactionList | ErrorDto> {
        try {
            return await this.TransactionsService.getUserFiatTransactions({
                userId: currentUser.userId,
            });
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }

    @Get('/:txId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lookup transactions details by transaction id' })
    async getTransactionByTxnId(
        @Param('txId') txId: string
    ): Promise<UserTransaction | ErrorDto> {
        try {
            return await this.TransactionsService.getTransactionByTxnId({
                txId,
            });
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }

    @Get('/hash/:txnHash')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Lookup transactions details by transaction hash!',
    })
    async getTransactionByTxnHash(
        @Param('txnHash') txnHash: string
    ): Promise<UserTransaction | ErrorDto> {
        try {
            return await this.TransactionsService.getTransactionByTxnHash(
                txnHash
            );
        } catch (err) {
            return {
                // @ts-ignore
                ...err,
            };
        }
    }

    @Get('/hash/:txnHash/status')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lookup transaction status by transaction hash' })
    async getTransactionStatusByTxnHash(
        @Param('txnHash') txnHash: string
    ): Promise<string | ErrorDto> {
        try {
            return await this.TransactionsService.getTransactionStatusByTxnHash(
                txnHash
            );
        } catch (err) {
            return {
                // @ts-ignore
                ...err,
            };
        }
    }

    @Get('/bank/transaction/:bankTxnId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lookup transaction by bank transaction id' })
    async getTransactionByBankTxnId(
        @Param('bankTxnId') bankTxnId: string
    ): Promise<UserTransaction | ErrorDto> {
        try {
            return await this.TransactionsService.getTransactionByBankTxnId(
                bankTxnId
            );
        } catch (err) {
            return {
                // @ts-ignore
                ...err,
            };
        }
    }

    @Post('/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a transaction' })
    @ApiBody({
        type: CreateTransactionRequestDto,
        examples: {
            valid: {
                value: {
                    exchange_rate: 82.56976,
                    crypto_amount: 1.14,
                    fiat_symbol: 'INR',
                    failure_code: null,
                    failure_desc: null,
                    crypto_symbol: 'USDT',
                    status: 'COMPLETED',
                    fiat_amount: 100,
                    txId: 'a892dc4a-aecb-4a22-9de4-2990b4179b77',
                    transaction_type: 'SELL',
                    bank_transaction_id: '227617569022',
                    source_id: '65d246fc-6a5b-43d7-89bf-944e95ff2279',
                    txn_hash:
                        '6146ccf6a66d994f7c363db875e31ca35581450a4bf6d3be6cc9ac79233a69d0',
                    address: '0xc4C98D77E71796Df5C171b1EB48Db2adfBc33004',
                    network: 'network',
                    // initTime: 1676278602000,
                    account_no: '054XXXXXX006',
                },
            },
        },
    })
    async create(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() createTransactionRequest: CreateTransactionRequestDto
    ): Promise<boolean | ErrorDto> {
        try {
            return await this.TransactionsService.createUserTransaction({
                userId: currentUser.userId,
                ...createTransactionRequest,
            });
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }

    @Put('/:txId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update a transaction by transaction id' })
    @ApiBody({
        type: UpdateUserTransactionRequestDto,
        examples: {
            valid: {
                value: {
                    exchange_rate: 82.56976,
                    crypto_amount: 1.14,
                    fiat_symbol: 'INR',
                    failure_code: null,
                    failure_desc: null,
                    crypto_symbol: 'USDT',
                    status: 'COMPLETED',
                    fiat_amount: 100,
                    txId: 'a892dc4a-aecb-4a22-9de4-2990b4179b77',
                    transaction_type: 'SELL',
                    bank_transaction_id: '227617569022',
                    source_id: '65d246fc-6a5b-43d7-89bf-944e95ff2279',
                    txn_hash:
                        '6146ccf6a66d994f7c363db875e31ca35581450a4bf6d3be6cc9ac79233a69d0',
                    address: '0xc4C98D77E71796Df5C171b1EB48Db2adfBc33004',
                    network: 'MATIC',
                    account_no: '054XXXXXX006',
                },
            },
        },
    })
    async update(
        @Param('txId') txId,
        @Body() payload: UpdateUserTransactionRequestDto
    ): Promise<boolean | ErrorDto> {
        try {
            return await this.TransactionsService.updateTransaction(
                { txId },
                payload
            );
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }

    @Post('/:txId/status')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Webhook to receive the status of a transaction by id',
    })
    @ApiBody({
        type: SendTransactionInputDto,
        examples: {
            valid: {
                value: {
                    status: '...any status',
                },
            },
        },
    })
    async sendTransactionStatus(
        @Param('txId') txId,
        @Body() request: SendTransactionInputDto
    ): Promise<boolean | ErrorDto> {
        try {
            return await this.TransactionsService.sendTransactionStatus(
                txId,
                request
            );
        } catch (err) {
            return {
                success: false,
                // @ts-ignore
                ...err,
            };
        }
    }
}
