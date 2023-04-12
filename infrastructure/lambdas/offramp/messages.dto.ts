export const INSUFFICIENT_BALANCE_ERROR_CODE = 6086;
export const KYC_NOT_VERIFIED_ERROR_CODE = 6094;
export const PROVIDER_ERROR_CODE = 9999;
export const ALL_OK = 200;

export class HandleTXMsgResponseDTO {
    success: boolean;
    code: number;
    text: string;
    user_id?: string;
    offrampSellResponse?: OfframpSellDataResponseDTO;
}

export class WithdrawRequestParamsDTO {
    fiat_amount: number;
    crypto_amount: number;
    payment_method?: string;
    fiat_symbol?: string;
    crypto_symbol?: string;
}

export class TXInboundMessage {
    wallet_address: string;
    txn_hash: string;
    user_id: string;
    fiat_amount: number;
    crypto_amount: number;
    payment_method: string;
    fiat_symbol: string;
    crypto_symbol: string;
}

export class UserBankAccountDetailsDTO {
    account_holder_name: string;
    ifsc_code: string;
    status: string;
    account_number: string;
    bank_id: string;
}

export class BankAccountDetails {
    account_holder_name: string;
    ifsc_code: string;
    status: string;
    account_number: string;
    bank_id: string;
}

export class UserDetailsResponseDTO {
    user_id: string;
    client_user_id: string;
    kyc_status: string;
    bank_accounts: BankAccountDetails[];
    deposit_address: string;
}

export class WalletBalanceDTO {
    available_balance: number;
    total_balance: number;
    coin_info: any;
    // "coin_info": {
    //   "USDT": {
    //     "withdraw_enable": number;
    //     "available_balance": 76.7,
    //     "total_balance_usd": 76.7,
    //     "deposit_enable": true,
    //     "available_balance_usd": 76.7,
    //     "total_balance": 76.7,
    //     "name": "TetherUS",
    //     "coin": "USDT"
    //   }
    // }
}

export class OfframpSellDataResponseDTO {
    status: string;
    fiat_amount: number;
    transaction_type: string;
    fiat_symbol: string;
    failure_code: string;
    exchange_rate: number;
    id: string;
    crypto_symbol: string;
    created_at: string;
    bank_transaction_id: string;
    source_id: string;
    failure_desc: string;
    crypto_amount: number;
}

export class OfframpSellResponseDTO {
    success: boolean;
    data: OfframpSellDataResponseDTO;
}
