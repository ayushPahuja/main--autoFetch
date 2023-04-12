import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { CurrentUser } from '@modules/authentication/decorators';
import { JwtAuthGuard } from '@modules/authentication/guards';
import { CurrentUserDto } from '@modules/users/users.dtos';
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UseGuards,
    Headers,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    CryptoWebhookRequestDto,
    DepositAddress,
    ErrorDto,
    FiatTxnRequestDto,
    HandlerResponseDto,
    InitParams,
    MetaTxnRequest,
    PaymentHistory,
    RegisterUserResponseDto,
    TokenPriceDto,
    UserBalance,
    UserKycDetails,
    WithdrawBankAccountRequest,
    WithdrawBankAccountResponse,
} from './offramp.dtos';
import { OfframpService } from './offramp.service';

@ApiBearerAuth()
@ApiTags('offramp')
@Controller('offramp')
export class OfframpController {
    constructor(private offrampService: OfframpService) {}

    @Get('/init/kyc')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get init params for user KYC' })
    getInitParamsFoKyc(@CurrentUser() currentUser: CurrentUserDto): InitParams {
        return this.offrampService.getInitParamsFoKyc(currentUser.userId);
    }

    @Post('/register/user')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Register user for offramp service' })
    @ApiBody({
        type: Object,
        examples: {
            valid: {},
        },
    })
    async registerUser(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<RegisterUserResponseDto | ErrorDto> {
        return await this.offrampService.registerUser({
            user_uuid: currentUser.userId,
            client_user_id: currentUser.username,
        });
    }

    @Get('/kyc/details')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get kyc details of the user for offramp' })
    async getUserDetails(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UserKycDetails | ErrorDto> {
        return await this.offrampService.getUserDetails(currentUser.userId,
            "USDT",
            process.env.NETWORK
        );
    }

    @Get('/deposit-address')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Get user's deposit address for offramp" })
    async getDepositAddress(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<DepositAddress[] | ErrorDto> {
        return await this.offrampService.getDepositAddress(currentUser.userId,
            "USDT",
            process.env.NETWORK
        );
    }

    @Get('/withdrawal/balance')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Get user's crypto withdrawal balance" })
    async getWithdrawalBalance(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<UserBalance | ErrorDto> {
        return await this.offrampService.getWithdrawalBalance(
            currentUser.userId
        );
    }

    @Get('/token-prices/:token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: `Get token price` })
    async getTokenPrice(
        @Param('token') token: string
    ): Promise<TokenPriceDto | ErrorDto> {
        return await this.offrampService.getTokenPrice(token);
    }

    @Post('/crypto/sell')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Sell crypto of the user' })
    @ApiBody({
        type: WithdrawBankAccountRequest,
        examples: {
            valid: {
                value: {
                    wallet_address:
                        '0x3b3B48f595E610C1568e72FF3e7c832e4Eab5c5d',
                    txn_hash:
                        '0x22465631d026ce878c177da33d487ddf3d17146ff1653cad7b94035ce287acf3',
                    fiat_symbol: 'INR',
                    crypto_symbol: 'USDT',
                    fiat_amount: 160,
                    crypto_amount: 2,
                    payment_method: 'bank_transfer',
                    txId: 'c173e948-4f3a-448e-b3b1-5af5ac0146b6',
                    initTime: 1676278602,
                },
            },
        },
    })
    async sellCrypto(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() payload: WithdrawBankAccountRequest
    ): Promise<HandlerResponseDto | ErrorDto> {
        return await this.offrampService.sellCrypto({
            user_id: currentUser.userId,
            ...payload,
        });
    }

    @Get('/user/transactions')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: `Get user transactions` })
    async getUserTransactions(
        @CurrentUser() currentUser: CurrentUserDto,
        @Query('page') page?: number,
        @Query('pageSize') pageSize?: number
    ): Promise<PaymentHistory | ErrorDto> {
        return await this.offrampService.getUserTransactions(
            currentUser.userId,
            'user',
            page,
            pageSize
        );
    }

    @Get('/withdrawal/transactions')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: `Get list of off-ramp related transactions of the user`,
    })
    async getTransactionHistory(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<PaymentHistory | ErrorDto> {
        return await this.offrampService.getUserTransactions(
            currentUser.userId,
            'withdrawal'
        );
    }

    @Post('/withdrawal/gas-fee')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: `Get gas fee for the user to transfer tokens` })
    @ApiBody({
        type: Object,
        examples: {
            valid: {},
        },
    })
    async getGasFee(
        @CurrentUser() currentUser: CurrentUserDto
    ): Promise<TransactionReceipt | ErrorDto> {
        return await this.offrampService.getGasForTxn(currentUser.userId);
    }

    @Post('/meta-txn')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: `Execute gasless transaction, either 'permit' or 'transfer'`,
    })
    @ApiBody({
        type: MetaTxnRequest,
        examples: {
            valid: {
                value: {
                    metaTxnType: 'transfer',
                    userAddress: '0x534e9B3EA1F77f687074685a5F7C8a568eF6D586',
                    params: [
                        '0xa8811925bFC041160624E0Fdf5F0708F1400721D',
                        '0x534e9b3ea1f77f687074685a5f7c8a568ef6d586',
                        {
                            type: 'BigNumber',
                            hex: '0x0f4240',
                        },
                        '0x534e9B3EA1F77f687074685a5F7C8a568eF6D586',
                        {
                            type: 'BigNumber',
                            hex: '0x09',
                        },
                        1673503200,
                        27,
                        '0x908da2828202663dcaf5f530dac706db250b4ad70c4284004a524e6e4b86ba71',
                        '0x1fe63a4e93699a80f7d3eff0ef615f2c70fa389ce87c34c1157e469e7af45399',
                    ],
                },
            },
        },
    })
    async executeTransfer(
        @CurrentUser() currentUser: CurrentUserDto,
        @Body() payload: MetaTxnRequest
    ): Promise<TransactionReceipt | ErrorDto> {
        return await this.offrampService.gaslessTxn(payload);
    }

    @Post('/crypto/transaction')
    @ApiOperation({ summary: 'Sell crypto transaction webhook' })
    @ApiBody({
        type: CryptoWebhookRequestDto,
        examples: {
            valid: {
                value: {
                    status: 'FAILED',
                    txn_hash: null,
                    crypto_symbol: 'USDT',
                    amount: '5.00000000',
                    transaction_type: 'WITHDRAW',
                    tag: '',
                    fees: '0E-8',
                    updated_at: 1675089046000,
                    id: '3f675401-d7cc-4f1d-bbdd-67bf65f7c48f',
                    network: 'MATIC',
                    created_at: 1675089002000,
                    address: '0x226af21d60133c23a59d51d1111439ca8afd26a7',
                    event: 'withdraw',
                    user_id: 'ec4022d4-d83d-425f-9e16-88ab5237df3f',
                },
            },
        },
    })
    async cryptoTransactionWebhook(
        @Headers() headers: object,
        @Body() payload: CryptoWebhookRequestDto | FiatTxnRequestDto
    ) {
        return await this.offrampService.webhookHandler(headers, payload);
    }

    // @Get('/user/:walletAddress/balance')
    // @UseGuards(JwtAuthGuard)
    // @ApiOperation({ summary: `Get crypto balance of the user` })
    // async getUserBalance(
    //     @Param('walletAddress') walletAddress: string
    // ): Promise<string | ErrorDto> {
    //     return await this.offrampService.getUserBalance(walletAddress);
    // }
}
