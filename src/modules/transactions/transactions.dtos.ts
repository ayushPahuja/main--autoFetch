import { isNotEmpty, IsNotEmpty, IsUUID } from 'class-validator';

export class GetTransactionInputDto {
    @IsNotEmpty()
    txId: string;
}

export class GetUserTransactionsInputDto {
    @IsNotEmpty()
    userId: string;
}

export class CreateTransactionRequestDto {
    @IsNotEmpty()
    @IsUUID('4')
    txId: string;
    exchange_rate: number;
    @IsNotEmpty()
    crypto_amount: number;
    @IsNotEmpty()
    fiat_symbol: string;
    failure_code: number;
    failure_desc: string;
    @IsNotEmpty()
    crypto_symbol: string;
    @IsNotEmpty()
    status: string;
    fiat_amount: number;
    @IsNotEmpty()
    transaction_type: string;
    bank_transaction_id: string;
    source_id: string;
    txn_hash: string;
    @IsNotEmpty()
    address: string;
    @IsNotEmpty()
    network: string;
    createdAt: number;
    account_no: string;
    initTime?: number;
}

export class CreateTransactionDto extends CreateTransactionRequestDto {
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;
}

export class FiatHistory extends CreateTransactionDto {
    updated_at: number;
}

export type UserTransactionList = UserTransaction[];

export class UserTransaction {
    @IsNotEmpty()
    @IsUUID('4')
    txId: string;
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;
    exchange_rate: number;
    @IsNotEmpty()
    crypto_amount: number;
    @IsNotEmpty()
    fiat_symbol: string;
    failure_code: number;
    failure_desc: string;
    @IsNotEmpty()
    crypto_symbol: string;
    @IsNotEmpty()
    status: string;
    fiat_amount: number;
    @IsNotEmpty()
    transaction_type: string;
    bank_transaction_id: string;
    source_id: string;
    txn_hash: string;
    @IsNotEmpty()
    address: string;
    @IsNotEmpty()
    network: string;
    createdAt: number;
    account_no: string;
    initTime?: number;
}

export class UpdateUserTransactionRequestDto {
    @IsNotEmpty()
    @IsUUID('4')
    txId: string;
    @IsNotEmpty()
    @IsUUID('4')
    userId: string;
    exchange_rate: number;
    @IsNotEmpty()
    crypto_amount: number;
    @IsNotEmpty()
    fiat_symbol: string;
    failure_code: number;
    failure_desc: string;
    @IsNotEmpty()
    crypto_symbol: string;
    @IsNotEmpty()
    status: string;
    fiat_amount: number;
    @IsNotEmpty()
    transaction_type: string;
    bank_transaction_id: string;
    source_id: string;
    txn_hash: string;
    @IsNotEmpty()
    address: string;
    @IsNotEmpty()
    network: string;
    createdAt: number;
    account_no: string;
}

export class GetTransactionOutputDto {
    // TODO - What are the expected fields?
    @IsNotEmpty()
    status: string;
    description: string;
    payload: object;
    @IsNotEmpty()
    txId: string;
    createdAt: number;
    initTime: number;
}

export class SendTransactionInputDto {
    // TODO - What are the expected fields?
    @IsNotEmpty()
    status: string;
    description: string;
    payload: object;
}

export class ErrorDto {
    success: boolean;
    code: number;
    text: string;
}