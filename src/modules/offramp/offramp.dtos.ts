import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TokenPriceDto {
    price: number;
    base_rate: number;
    mudrex_fee_factor: number;
    tax_factor: number;
}

export class WithdrawBankAccountRequest {
    @IsNotEmpty()
    @IsNumber()
    fiat_amount: number;

    @IsNotEmpty()
    @IsNumber()
    crypto_amount: number;

    @IsString()
    txn_hash: string;

    @IsString()
    wallet_address: string;

    @IsString()
    payment_method: string;

    @IsString()
    fiat_symbol: string;

    @IsString()
    crypto_symbol: string;

    @IsString()
    txId: string;

    @IsNumber()
    initTime: number;
}

export class CryptoTransaction {
    id: string;
    network: string;
    usd_value: number;
    txn_hash: string;
    status: string;
    address: string;
    created_at: number;
    transaction_type: TransactionType;
    amount: number;
    crypto_symbol: string;
}

export class BankTransaction {
    id: string;
    exchange_rate: number;
    crypto_amount: number;
    fiat_symbol: string;
    failure_code: number;
    failure_desc: string;
    crypto_symbol: string;
    status: string;
    fiat_amount: number;
    created_at: number;
    transaction_type: string;
    bank_transaction_id: string;
    source_id: string;
    account_no: string;
}

export class WithdrawBankAccountResponse extends BankTransaction {
    user_id: string;
}

export class SellCryptoRequest extends WithdrawBankAccountRequest {
    user_id: string;
    txId: string;
}

export class EventBridgeMessage extends SellCryptoRequest {
    wallet_address: string;
    txn_hash: string;
    source_id: string;
}

export class TransactionHistory {
    history: (BankTransaction | CryptoTransaction)[];
    count: number;
}

export class PaymentHistory {
    tradeHistory: CryptoTransaction[];
    redeemHistory: BankTransaction[];
}

export class OptionsHeader {
    headers: {
        'X-Timestamp': number;
        'X-Client-Id': string;
        'X-Secret-Key': any;
        'X-Request-Id': string;
        'X-User-Id'?: string;
    };
}

export class DepositAddress {
    network: string; // 'MATIC';
    name: string; // 'Polygon Network';
    coin: string; // 'USDT';
    address: string; // '0xc37e9cbe6e1d481d9372585e1b91cb387853d352';
    tag: string; // '407410902';
    url: string; // 'https://polygonscan.com/address/0xc37e9cbe6e1d481d9372585e1b91cb387853d352';
}

export class BankAccountDetails {
    account_holder_name: string;
    ifsc_code: string;
    status: BankStatus;
    account_number: string;
    bank_id: string;
}

export class UserKycDetails {
    user_id: string;
    client_user_id: string;
    kyc_status: 'Verified' | 'Unverified';
    bank_accounts: BankAccountDetails[];
    deposit_address: string;
}

export class RegisterUserRequestDto {
    @IsNotEmpty()
    @IsString()
    user_uuid: string;

    @IsNotEmpty()
    @IsString()
    client_user_id: string;
}

export class RegisterUserResponseDto extends RegisterUserRequestDto {}

export class UserBalance {
    total_balance: number;
    available_balance: number;
    coin_info: {
        [key: string]: CoinInfo;
    };
}

export class CoinInfo {
    available_balance_usd: number;
    available_balance: number;
    withdraw_enable: boolean;
    name: string;
    coin: string;
    total_balance: number;
    total_balance_usd: number;
    deposit_enable: boolean;
}

export class ErrorDto {
    success: boolean;
    code: number;
    text: string;
}

export class HandlerResponseDto {
    success: boolean;
    code: number;
    text: string;
}

export class InitParams {
    user_id: string;
    client_id: string;
    secret: string;
    timestamp: number;
}

// Mudrex status for transactions
// export type TransactionStatus =
//     | 'CREATED'
//     | 'PROCESSING'
//     | 'COMPLETED'
//     | 'FAILED'
//     | 'CANCELLED'
//     | 'EXPIRED';

export type BankStatus =
    | 'Approved'
    | 'deleted'
    | 'pending'
    | 'rejected'
    | 'name_rejected';

export type TransactionType = 'SELL' | 'BUY' | 'DEPOSIT' | 'WITHDRAW';

export type MetaTransactionType = 'Transfer' | 'Approve';

export type TransactionsHistoryType = 'user' | 'withdrawal';

export type MetaTxnType = 'transfer' | 'approve';

export type TransactionStatus =
    | 'CRYPTO_INIT'
    | 'CRYPTO_FAILED'
    | 'CRYPTO_COMPLETED'
    | 'AML_FAILED'
    | 'FIAT_INIT'
    | 'FIAT_FAILED'
    | 'FIAT_COMPLETED';
export const CRYPTO_INIT = 301;
export const CRYPTO_FAILED = 302;
export const CRYPTO_COMPLETED = 303;
export const AML_FAILED = 304;
export const FIAT_INIT = 305;
export const FIAT_FAILED = 306;
export const FIAT_COMPLETED = 307;
export const UNAUTHORISED_REQUEST = 308;

export const MUDREX_SUCCESS = "completed";
export const MUDREX_FAILED = "failed";
export const TXN_HASH_NOT_FOUND = 404;

export class MetaTxnRequest {
    @IsNotEmpty()
    @IsString()
    metaTxnType: MetaTxnType;

    @IsNotEmpty()
    @IsString()
    userAddress: string;

    @IsNotEmpty()
    @IsArray()
    params: Array<any>;
}

export class FiatTxnRequestDto {
    @IsNotEmpty()
    @IsString()
    event: string;

    @IsNotEmpty()
    @IsString()
    user_id: string;

    @IsNotEmpty()
    @IsString()
    client_id: string;

    @IsNotEmpty()
    @IsString()
    transaction_status: string;

    @IsNotEmpty()
    @IsString()
    invested_at: string;

    @IsNotEmpty()
    @IsString()
    transaction_id: string;

    @IsNotEmpty()
    @IsString()
    transfer_type: string;

    @IsNotEmpty()
    @IsString()
    bank_reference_id: string;

    @IsNotEmpty()
    @IsString()
    usd_amount: string;

    @IsNotEmpty()
    @IsString()
    fiat_amount: string;
}

export class CryptoWebhookRequestDto {
    @IsNotEmpty()
    @IsString()
    network: string;

    @IsNotEmpty()
    @IsString()
    event: string;

    @IsNotEmpty()
    @IsString()
    status: string;

    @IsNotEmpty()
    @IsString()
    amount: string;

    @IsNotEmpty()
    @IsString()
    user_id: string;

    @IsNotEmpty()
    @IsString()
    txn_hash: string;

    @IsNotEmpty()
    @IsString()
    crypto_symbol: string;

    @IsNotEmpty()
    @IsString()
    transaction_type: string;

    @IsString()
    tag: string;

    @IsString()
    usd_value: string;

    @IsNotEmpty()
    @IsNumber()
    updated_at: number;

    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsNumber()
    created_at: number;

    @IsNotEmpty()
    @IsString()
    address: string;
}
