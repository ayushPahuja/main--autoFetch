import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { UserTransaction } from '@modules/transactions/transactions.dtos';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { UsersService } from '@modules/users/users.service';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { createHmac } from 'crypto';
import { BigNumber, ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import {
    AML_FAILED,
    BankTransaction,
    CryptoTransaction,
    CryptoWebhookRequestDto,
    CRYPTO_COMPLETED,
    CRYPTO_FAILED,
    DepositAddress,
    ErrorDto,
    EventBridgeMessage,
    FiatTxnRequestDto,
    FIAT_COMPLETED,
    FIAT_FAILED,
    FIAT_INIT,
    HandlerResponseDto,
    InitParams,
    MetaTxnRequest,
    MUDREX_FAILED,
    MUDREX_SUCCESS,
    OptionsHeader,
    PaymentHistory,
    RegisterUserRequestDto,
    RegisterUserResponseDto,
    SellCryptoRequest,
    TokenPriceDto,
    TransactionHistory,
    TransactionsHistoryType,
    TXN_HASH_NOT_FOUND,
    UNAUTHORISED_REQUEST,
    UserBalance,
    UserKycDetails,
    WithdrawBankAccountResponse,
} from './offramp.dtos';

@Injectable()
export class OfframpService {
    private readonly MudrexBaseUrl: string = process.env.MUDREX_BASE_URL;

    constructor(
        private readonly HttpService: HttpService,
        private readonly UsersService: UsersService,
        private readonly TransactionsService: TransactionsService
    ) {}

    async registerUser(
        userObj: RegisterUserRequestDto
    ): Promise<RegisterUserResponseDto | ErrorDto> {
        try {
            const registerUserEndpoint = `${this.MudrexBaseUrl}api/v1/user/client_user`;
            const options = this.createOptionsConfig(userObj.user_uuid, true);
            const { data } = await this.HttpService.axiosRef.post(
                registerUserEndpoint,
                userObj,
                options
            );
            return this.handleResponses(data);
        } catch (error) {
            // Mostly, either of the user_id or client_user_id would be incorrect or not unique (both have to be unique)
            return this.handleErrors(error);
        }
    }

    async getUserDetails(
        user_id: string,
        token: string = 'USDT',
        network: string = 'MATIC'
    ): Promise<UserKycDetails | ErrorDto> {
        try {
            const userDetailsEndpoint = `${this.MudrexBaseUrl}api/v1/user/client_user?user_uuid=${user_id}`;
            const depositAddressEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/user_deposit_address?symbol=${token}&network=${network}`;
            const options = this.createOptionsConfig(user_id);
    
            const [userDetailsResponse, depositAddressResponse] = await Promise.all([
                this.HttpService.axiosRef.get(userDetailsEndpoint, options).catch(err => {
                    throw new Error('Failed to get user details');
                }),
                this.HttpService.axiosRef.get(depositAddressEndpoint, options).catch(err => {
                    throw new Error('Failed to get deposit address');
                }),
            ]);
    
            if (userDetailsResponse?.data?.success) {
                const { user_uuid, ...userDetails } = userDetailsResponse.data.data;
                const deposit_address =
                    depositAddressResponse?.data?.success && depositAddressResponse.data.data[0]?.address
                        ? depositAddressResponse.data.data[0].address
                        : 'User not registered for offramp';
    
                return {
                    user_id: user_uuid,
                    deposit_address,
                    ...userDetails,
                };
            }
    
            return {
                success: false,
                code: 6091,
                text: 'X-User-Id invalid',
            };
        } catch (error: any) {
            console.error(`Error in getUserDetails for user ${user_id}:`, error);
    
            const errorDto: ErrorDto = {
                success: false,
                code: 500,
                text: 'Internal server error',
            };
    
            return errorDto;
        }
    }    

    async getDepositAddress(
        user_id: string,
        token: string = 'USDT',
        network: string = 'MATIC'
    ): Promise<DepositAddress[] | ErrorDto> {
        try {
            const depositAddressEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/user_deposit_address?symbol=${token}&network=${network}`;
            const options = this.createOptionsConfig(user_id);
            const { data } = await this.HttpService.axiosRef.get(
                depositAddressEndpoint,
                options
            );
            return this.handleResponses(data);
        } catch (error) {
            return this.handleErrors(error);
        }
    }

    async getWithdrawalBalance(
        user_id: string
    ): Promise<UserBalance | ErrorDto> {
        try {
            const userBalanceEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/balance?account=SPOT`;
            const options = this.createOptionsConfig(user_id);
            const { data } = await this.HttpService.axiosRef.get(
                userBalanceEndpoint,
                options
            );
            return this.handleResponses(data);
        } catch (error) {
            return this.handleErrors(error);
        }
    }

    async getTokenPrice(token: string): Promise<TokenPriceDto | ErrorDto> {
        try {
            const tokenPriceEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/conversion/fiat/price?fiat=INR&crypto=${token}&type=sell`;
            const options = this.createOptionsConfig('');
            const { data } = await this.HttpService.axiosRef.get(
                tokenPriceEndpoint,
                options
            );
            return this.handleResponses(data);
        } catch (error) {
            return this.handleErrors(error);
        }
    }

    async sellCrypto(
        sellCryptoRequest: SellCryptoRequest
    ): Promise<HandlerResponseDto | ErrorDto> {
        try {
            if (process.env.NODE_ENV !== 'prod') {
                return {} as HandlerResponseDto;
            }
            const { user_id, wallet_address, payment_method, txn_hash, txId, initTime, ...withdrawRequestParams } = sellCryptoRequest;
            const createTransactionDto = {
                ...withdrawRequestParams,
                exchange_rate: null,
                failure_code: null,
                failure_desc: null,
                status: 'CRYPTO_COMPLETED', // Crypto successful and redeem initiated
                txId,
                txn_hash,
                userId: user_id,
                transaction_type: 'DEPOSIT',
                bank_transaction_id: null,
                source_id: null,
                address: wallet_address,
                network: process.env.NETWORK,
                account_no: null,
                initTime,
                createdAt: Date.now()
            };
            await this.TransactionsService.createUserTransaction(
                createTransactionDto
            );
            // @ts-ignore
            return {
                success: true,
                code: CRYPTO_COMPLETED,
                text: 'CRYPTO_COMPLETED',
            };
        } catch (error) {
            return this.handleErrors(error);
        }
    }

    async sendOffRampMessage(offrampMessage: SellCryptoRequest) {
        try {
            const eventbridge = new AWS.EventBridge();

            // Prepare the event to send
            const event = {
                Source: 'offramp',
                DetailType: 'SELL',
                Detail: JSON.stringify(offrampMessage),
                // EventBusName: 'kostas-OffRampEventBus'
                EventBusName: `${process.env.NODE_ENV}-OffRampEventBus`,
            };

            // Send the event
            const data = await eventbridge
                .putEvents({ Entries: [event] })
                .promise();
            console.log(
                'This message would be returned to the frontend: ',
                data
            );
            return data.Entries;
        } catch (err) {
            console.log('Error: ', err);
        }
    }

    async webhookHandler(
        headers: object,
        payload: CryptoWebhookRequestDto | FiatTxnRequestDto
    ) {
        console.log('webhookHandler payload: ', payload);
        const isValid = this.isValidRequest(headers);
        if (isValid) {
            if (payload.event.toLowerCase() === 'sell' || payload.event.toLowerCase() === 'buy') {
                // @ts-ignore
                return await this.fiatTransactionHandler(payload);
            } else if (
                payload.event.toLowerCase() === 'deposit' ||
                payload.event.toLowerCase() === 'withdraw'
            ) {
                // @ts-ignore
                return await this.cryptoTransactionHandler(payload);
            }
        }
        return {
            success: false,
            code: UNAUTHORISED_REQUEST,
            text: 'UNAUTHORISED_REQUEST',
        };
    }

    isValidRequest(headers) {
        const timeInSeconds = headers['x-timestamp'];
        const clientId = process.env.OFFRAMP_CLIENT_ID;
        const sigString = clientId + timeInSeconds + headers['x-user-id'];
        const secretKey = createHmac('sha256', process.env.OFFRAMP_SECRET_KEY)
            .update(sigString)
            .digest()
            .toString('hex')
            .toUpperCase();

        return secretKey === headers['x-secret-key'] ? true : false;
    }

    async fiatTransactionHandler(payload: FiatTxnRequestDto) {
        try {
            console.log('fiatTransactionHandler payload: ', payload);
            let userTxn = await this.TransactionsService.getTransactionByBankTxnId(payload.transaction_id);
            if (userTxn?.status === 'FIAT_INIT') {
                if (payload.transaction_status.toLowerCase() === MUDREX_SUCCESS) {
                    // Record the transaction in DynamoDB
                    userTxn.transaction_type = payload.event;
                    userTxn.createdAt = Date.now();
                    userTxn.status = "FIAT_COMPLETED";
                    userTxn.fiat_amount = Number(payload.fiat_amount);
                    userTxn.crypto_amount = Number(payload.usd_amount);
                    await this.TransactionsService.createUserTransaction(
                        userTxn
                    );
                    return {
                        success: true,
                        code: FIAT_COMPLETED,
                        text: 'FIAT_COMPLETED',
                    };
                } else if (payload.transaction_status.toLowerCase() === MUDREX_FAILED) {
                    userTxn.transaction_type = payload.event;
                    userTxn.createdAt = Date.now();
                    userTxn.status = "FIAT_FAILED";
                    userTxn.fiat_amount = Number(payload.fiat_amount);
                    userTxn.crypto_amount = Number(payload.usd_amount);
                    await this.TransactionsService.createUserTransaction(
                        userTxn
                    );
                    return {
                        success: true,
                        code: FIAT_FAILED,
                        text: 'FIAT_FAILED',
                    };
                }
            }else {
                console.log("User Txn not found with BankTxnId: ", payload.transaction_id, " for payload: ", payload);
            } 
            return {
                success: false,
                code: userTxn.status,
                text: `${userTxn.status}`,
            }
        } catch (error) {
            return {
                success: false,
                // @ts-ignore
                ...error
            }
        }
    }

    async cryptoTransactionHandler(payload: CryptoWebhookRequestDto) {
        // try {
            const startTime = Date.now();
            console.log('cryptoTransactionHandler payload: ', payload);
            const options = this.createOptionsConfig(payload.user_id);
            const cryptoSellEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/conversion/fiat/sell`;
            let userTxn = await this.TransactionsService.getTransactionByTxnHash(payload.txn_hash);
            // @ts-ignore
            if (!Object.keys(userTxn).length) {
                console.log(`Didn't get a transaction object for txn_hash: ${payload.txn_hash}`);
                throw new HttpException(`Transaction with txn_hash ${payload.txn_hash} not found.`, TXN_HASH_NOT_FOUND);
            }
            console.log("Time taken post txn fetch: ", Date.now() - startTime, " for payload: ", payload);
            if (userTxn.status === 'CRYPTO_COMPLETED') {
                if (payload.status.toLowerCase() === MUDREX_FAILED) {
                    console.log("Updating Txn status to AML_FAILED: ", payload);

                    // Record the transaction in DynamoDB
                    userTxn.createdAt = Date.now();
                    userTxn.status = 'AML_FAILED';
                    await this.TransactionsService.createUserTransaction(
                        userTxn
                    );
                    console.log("Time taken to save data in db: ", Date.now() - startTime, " for payload", payload);
                    return {
                        success: true,
                        code: AML_FAILED,
                        text: 'AML_FAILED',
                    };
                } else if (payload.status.toLowerCase() === MUDREX_SUCCESS) {
                    const balance = await this.getWithdrawalBalance(payload.user_id);
                    if (
                        'available_balance' in balance &&
                        balance.available_balance >= Number(payload.amount)
                    ) {
                        const userDetailsEndpoint = `${this.MudrexBaseUrl}api/v1/user/client_user?user_uuid=${payload.user_id}`;
                        const userDetailsResponse = await this.HttpService.axiosRef.get(
                            userDetailsEndpoint,
                            options
                        );
                        console.log("Time taken for user details: ", Date.now() - startTime, " for payload: ", payload);
                        console.log("User details: ", userDetailsResponse, ", for payload: ", payload);
                        const source_id =
                            userDetailsResponse.data.data.bank_accounts[0].bank_id;
                        const account_no =
                            userDetailsResponse.data.data.bank_accounts[0].account_number;
                        const withdrawRequestParams = {
                            source_id,
                            fiat_symbol: 'INR',
                            crypto_symbol: 'USDT',
                            fiat_amount: Number(payload.amount) * 80,
                            crypto_amount: Number(payload.amount),
                            payment_method: 'bank_transfer',
                        };
                        const { data } = await this.HttpService.axiosRef.post(
                            cryptoSellEndpoint,
                            withdrawRequestParams,
                            options
                        );
                        console.log("Time taken to execute Mudrex call for FIAT_INIT: ", Date.now() - startTime, ", for payload: ", payload);
                        console.log("Fiat sell api response: ", data, ", for payload: ", payload);
                        let bankTransaction = {} as BankTransaction;
                        if (data.success) {
                            bankTransaction = this.handleResponses(data);
                        }
                        console.log("bankTransaction: ", bankTransaction, ", for payload: ", payload);
                        const { id, status, created_at, bank_transaction_id, ...sellCryptoResponse } = bankTransaction;
                        const fiatTransactionDto = {
                            ...sellCryptoResponse,
                            status: 'FIAT_INIT',
                            userId: userTxn.userId,
                            bank_transaction_id: id,
                            txId: userTxn.txId,
                            txn_hash: payload.txn_hash,
                            address: payload.address,
                            network: payload.network,
                            account_no,
                            createdAt: created_at,
                            initTime: userTxn.initTime
                        };
                        await this.TransactionsService.createUserTransaction(
                            fiatTransactionDto
                        );
                        console.log("Time taken to save FIAT_INIT data in db: ", Date.now() - startTime, ", for payload: ", payload);
                        return {
                            success: true,
                            code: FIAT_INIT,
                            text: 'FIAT_INIT',
                        };
                    }
                    else{
                        console.log("User don't have sufficient balance: ", balance, ", for payload: ", payload);
                    }
                }
            }
            else{
                console.log("Txn status didn't match CRYPTO_COMPLETED: ", payload);
            }
    }

    async getBankTransactions(
        user_id: string
    ): Promise<TransactionHistory | ErrorDto> {
        try {
            const txnHistoryEndpoint = `${this.MudrexBaseUrl}api/v1/wallet/user/transaction_history`;
            const options = this.createOptionsConfig(user_id);
            const { data } = await this.HttpService.axiosRef.get(
                txnHistoryEndpoint,
                options
            );
            return this.handleResponses(data);
        } catch (error) {
            return this.handleErrors(error);
        }
    }

    async getUsersBankAccountNo(user_id: string): Promise<string | ErrorDto> {
        try {
            const userDetailsEndpoint = `${this.MudrexBaseUrl}api/v1/user/client_user?user_uuid=${user_id}`;
            const options = this.createOptionsConfig(user_id);
            const userDetailsResponse = await this.HttpService.axiosRef.get(
                userDetailsEndpoint,
                options
            );
            if (userDetailsResponse.data?.success) {
                const { user_uuid, ...userDetails } =
                    userDetailsResponse.data.data;
                return userDetails.bank_accounts[0].account_number;
            }
        } catch (error) {
            console.log('Error in fetching user bank account: ', error);
        }
        return {
            success: false,
            code: 6091,
            text: 'Some error occurred',
        };
    }

    async getUserTransactions(
        user_id: string,
        transactionType: TransactionsHistoryType = 'user',
        page?: number,
        pageSize?: number
    ): Promise<PaymentHistory | ErrorDto> {
        try {
            const wallet = await this.UsersService.getUserWalletAddress({
                userId: user_id,
            });
    
            if (!wallet) {
                return {
                    success: false,
                    code: 404,
                    text: 'User wallet address not found',
                };
            }

            const userTxnsEndpoint = page && pageSize 
            ? `https://api.covalenthq.com/v1/${process.env.CHAIN_ID}/address/${wallet.address}/transfers_v2/?contract-address=${process.env.USDT_ADDRESS}&key=${process.env.COVALENT_API_KEY}&page-number=${page}&page-size=${pageSize}`
            : `https://api.covalenthq.com/v1/${process.env.CHAIN_ID}/address/${wallet.address}/transfers_v2/?contract-address=${process.env.USDT_ADDRESS}&key=${process.env.COVALENT_API_KEY}`;

            const { data } = await this.HttpService.axiosRef.get(userTxnsEndpoint, {
                headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
            });
    
            if (!data) {
                return {
                    success: false,
                    code: 404,
                    text: 'Transaction data not found',
                };
            }
    
            if (data.error) {
                return {
                    success: false,
                    code: data.error_code || 404,
                    text: data.error_message || 'Transaction data error',
                };
            }
    
            const userTransactions: CryptoTransaction[] = data.data?.items
                ?.map((item) => this.returnCryptoTxn(item))
                .filter(Boolean);
    
            const userMudrexAddress = await this.getDepositAddress(user_id);
    
            userTransactions.sort(
                (txnA, txnB) => txnB.created_at - txnA.created_at
            );
    
            if (!userMudrexAddress[0]?.address) {
                return {
                    tradeHistory: userTransactions,
                    redeemHistory: [],
                };
            } else {
                const filteredTxns = userTransactions.filter(
                    (transaction) =>
                        transactionType === 'withdrawal'
                            ? transaction.transaction_type === 'WITHDRAW' &&
                              transaction.address === userMudrexAddress[0].address
                            : !(
                                  transaction.transaction_type === 'WITHDRAW' &&
                                  transaction.address ===
                                      userMudrexAddress[0].address
                              )
                );
    
                return {
                    tradeHistory: filteredTxns,
                    redeemHistory: [],
                };
            }
        } catch (error: any) {
            console.log('Error:', error);

            return {
                success: false,
                code: error?.response?.data?.error_code || 500,
                text: error?.response?.data?.error_message || 'Unknown error occurred',
            };
        }
    }

    getInitParamsFoKyc(user_id: string): InitParams {
        try {
            const timeInSeconds = Math.floor(Date.now() / 1000);
            const clientId = process.env.OFFRAMP_CLIENT_ID;
            const sigString = clientId + timeInSeconds + 'sdk' + user_id;
            const secretKey = createHmac(
                'sha256',
                process.env.OFFRAMP_SECRET_KEY
            )
                .update(sigString)
                .digest()
                .toString('hex')
                .toUpperCase();
            return {
                secret: secretKey,
                client_id: process.env.OFFRAMP_CLIENT_ID,
                user_id,
                timestamp: timeInSeconds,
            };
        } catch (err) {
            console.log('Error:', err);
        }
    }

    async getGasForTxn(
        user_id: string
    ): Promise<TransactionReceipt | ErrorDto> {
        try {
            const wallet = await this.UsersService.getUserWalletAddress({
                userId: user_id,
            });
            const { data } = await this.HttpService.axiosRef.get(
                process.env.GAS_STATION_URL
            );
            const provider = new ethers.providers.InfuraProvider(
                process.env.PROVIDER_NAME,
                process.env.INFURA_KEY
            );
            const gasTankWallet = new ethers.Wallet(
                process.env.PRIVATE_KEY,
                provider
            );
            const balance = await provider.getBalance(wallet.address);
            const maxFeePerGas = Math.ceil(data.fast.maxFee) * 10 ** 9;
            const maxPriorityFeePerGas =
                Math.ceil(data.fast.maxPriorityFee) * 10 ** 9;
            const gasEstimate =
                BigNumber.from(maxPriorityFeePerGas).mul(646250); // 64625 is the gas units for transfer + buffer (for approx 10 txns)
            const maxGasAllowed = ethers.utils.parseEther('.1');
            if (balance.lt(gasEstimate) && balance.lt(maxGasAllowed)) {
                const tx = {
                    from: gasTankWallet.address,
                    to: wallet.address,
                    value: gasEstimate.sub(balance),
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                };
                const txnResponse = await gasTankWallet.sendTransaction(tx);
                return await txnResponse.wait();
            }
            return {
                success: true,
                code: 201,
                text: 'User has sufficient gas fee',
            };
        } catch (error) {
            return {
                success: false,
                // @ts-ignore
                ...error,
            };
        }
    }

    async gaslessTxn(metaTxnParams: MetaTxnRequest) {
        try {
            const biconomyEndpoint = `https://api.biconomy.io/api/v2/meta-tx/native`;
            const headers = {
                'x-api-key': `${process.env.BICONOMY_API_KEY}`,
                'Content-Type': 'application/json',
            };
            const { metaTxnType, userAddress, params } = metaTxnParams;
            const { data } = await this.HttpService.axiosRef.post(
                biconomyEndpoint,
                {
                    userAddress,
                    params,
                    apiId:
                        metaTxnType === 'approve'
                            ? process.env.APPROVE_API_ID
                            : process.env.TRANSFER_API_ID,
                },
                { headers }
            );
            return data;
        } catch (error) {
            // @ts-ignore
            return error.response.data;
        }
    }

    async getUserBalance(walletAddress: string): Promise<string | ErrorDto> {
        try {
            const balanceEndpoint = `https://deep-index.moralis.io/api/v2/${walletAddress}/erc20?chain=${process.env.CHAIN_NAME}&token_addresses%5B0%5D=${process.env.USDT_ADDRESS}`;
            const { data } = await this.HttpService.axiosRef.get(
                balanceEndpoint,
                {
                    headers: {
                        'X-API-Key': process.env.MORALIS_API_KEY,
                        accept: 'application/json',
                    },
                }
            );
            console.log(data.result[0].balance);
            return data.result[0].balance;
        } catch (error) {
            // @ts-ignore
            return error.response.data;
        }
    }

    createOptionsConfig(
        user_id: string,
        registerUserFlag: boolean = false
    ): OptionsHeader {
        const timeInSeconds = Math.floor(Date.now() / 1000);
        const requestId = uuidv4();
        const sigString = registerUserFlag
            ? requestId + timeInSeconds
            : requestId + timeInSeconds + user_id;
        const secretKey = createHmac('sha256', process.env.OFFRAMP_SECRET_KEY)
            .update(sigString)
            .digest()
            .toString('hex')
            .toUpperCase();

        const headers = registerUserFlag
            ? {
                  'X-Timestamp': timeInSeconds,
                  'X-Client-Id': process.env.OFFRAMP_CLIENT_ID,
                  'X-Secret-Key': secretKey,
                  'X-Request-Id': requestId,
              }
            : {
                  'X-Timestamp': timeInSeconds,
                  'X-Client-Id': process.env.OFFRAMP_CLIENT_ID,
                  'X-User-Id': user_id,
                  'X-Secret-Key': secretKey,
                  'X-Request-Id': requestId,
              };
        const options = {
            headers,
        };
        return options;
    }

    returnCryptoTxn(item): CryptoTransaction {
        if (item.transfers[0].delta > 0) {
            return {
                id: item.tx_hash,
                network: process.env.NETWORK,
                usd_value: item.transfers[0].delta / 1000000,
                txn_hash: item.tx_hash,
                status: item.successful ? 'COMPLETED' : 'FAILED',
                address:
                    item.transfers[0].transfer_type === 'OUT'
                        ? item.transfers[0].to_address
                        : item.transfers[0].from_address,
                created_at: new Date(item.transfers[0].block_signed_at).getTime(),
                transaction_type:
                    item.transfers[0].transfer_type === 'IN'
                        ? 'DEPOSIT'
                        : 'WITHDRAW',
                amount: item.transfers[0].delta / 1000000,
                crypto_symbol: 'USDT',
            };
        }
    }

    handleResponses(data) {
        if (data.success) {
            return data.data;
        } else {
            return {
                success: false,
                ...data.errors,
            };
        }
    }

    handleErrors(error): ErrorDto {
        return {
            success: false,
            // @ts-ignore
            code: error.response.data.errors[0].code,
            // @ts-ignore
            text: error.response.data.errors[0].text,
        };
    }
}
