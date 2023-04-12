import {
    AttributeValue,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { DatabaseService } from '@modules/database/database.service';
import { Injectable } from '@nestjs/common';
import {
    UserTransaction,
    UserTransactionList,
    GetUserTransactionsInputDto,
    GetTransactionInputDto,
    UpdateUserTransactionRequestDto,
    SendTransactionInputDto,
    CreateTransactionDto,
    FiatHistory,
} from './transactions.dtos';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDB } from 'aws-sdk';

@Injectable()
export class TransactionsService {
    constructor(private readonly DatabaseService: DatabaseService) {}

    async updateTransaction(
        { txId }: GetTransactionInputDto,
        payload: UpdateUserTransactionRequestDto
    ): Promise<boolean> {
        const {
            exchange_rate,
            crypto_amount,
            fiat_symbol,
            failure_code,
            failure_desc,
            crypto_symbol,
            status,
            fiat_amount,
            userId,
            transaction_type,
            bank_transaction_id,
            source_id,
            txn_hash,
            address,
            network,
            account_no,
        } = payload;
        const result = await this.DatabaseService.client.send(
            new PutItemCommand({
                TableName: `${process.env.NODE_ENV}-Transaction-Status`,
                Item: marshall({
                    txId,
                    exchange_rate,
                    crypto_amount,
                    fiat_symbol,
                    failure_code,
                    failure_desc,
                    crypto_symbol,
                    status,
                    fiat_amount,
                    userId,
                    transaction_type,
                    bank_transaction_id,
                    source_id,
                    txn_hash,
                    address,
                    network,
                    account_no,
                    createdAt: Date.now(),
                }),
            })
        );
        return true;
    }

    async getTransactionByTxnId({
        txId,
    }: GetTransactionInputDto): Promise<UserTransaction> {
        const getItemCommand = new QueryCommand({
            TableName: `${process.env.NODE_ENV}-Transaction-Status`,
            KeyConditionExpression: 'txId = :txId',
            ExpressionAttributeValues: { ':txId': { S: txId } },
        });
        const result = await this.DatabaseService.client.send(getItemCommand);
        let resultDto: UserTransaction = {} as UserTransaction;

        let rows = result.Items;
        // @ts-ignore
        resultDto = rows.length ? unmarshall(rows.sort((txnA, txnB) => unmarshall(txnB).createdAt - unmarshall(txnA).createdAt)[0])  : {} as UserTransaction;
        return resultDto;
    }

    async getTransactionByBankTxnId(bankTxnId: string): Promise<UserTransaction> {
        const items: DynamoDB.AttributeMap[] = [];
        let lastEvaluatedKey: DynamoDB.Key | any;

        do {
            const scanTable = new ScanCommand({
                TableName: `${process.env.NODE_ENV}-Transaction-Status`,
                FilterExpression: 'bank_transaction_id = :bank_transaction_id',
                ExpressionAttributeValues: { ':bank_transaction_id': { S: bankTxnId } },
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const result = await this.DatabaseService.client.send(scanTable);

            items.push(...result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;

        } while (lastEvaluatedKey);

        const txnItem = items.length ? items
            .map((item) => unmarshall(item as Record<string, AttributeValue>))
            .sort((a, b) => b.createdAt - a.createdAt)[0] as UserTransaction : {} as UserTransaction;

        return txnItem;
    }

    async getTransactionByTxnHash(txn_hash: string): Promise<UserTransaction> {
        const items: DynamoDB.AttributeMap[] = [];
        let lastEvaluatedKey: DynamoDB.Key | any;

        do {
            const scanTable = new ScanCommand({
                TableName: `${process.env.NODE_ENV}-Transaction-Status`,
                FilterExpression: 'txn_hash = :txn_hash',
                ExpressionAttributeValues: { ':txn_hash': { S: txn_hash } },
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const result = await this.DatabaseService.client.send(scanTable);

            items.push(...result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;

        } while (lastEvaluatedKey);

        const txnItem = items.length ? items
            .map((item) => unmarshall(item as Record<string, AttributeValue>))
            .sort((a, b) => b.createdAt - a.createdAt)[0] as UserTransaction : {} as UserTransaction;

        return txnItem;
    }

    async getTransactionStatusByTxnHash(txn_hash: string): Promise<string> {
        let resultDto: UserTransaction = {} as UserTransaction;

        resultDto = await this.getTransactionByTxnHash(txn_hash);

        return resultDto?.status ? resultDto.status : 'Txn not found';
    }

    async getUserTransactions({
        userId,
    }: GetUserTransactionsInputDto): Promise<UserTransactionList> {
        const scanTable = new ScanCommand({
            TableName: `${process.env.NODE_ENV}-Transaction-Status`,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': { S: userId } },
        });

        const result = await this.DatabaseService.client.send(scanTable);

        let resultDto = [] as UserTransactionList[];

        if (!result.Count) return [] as UserTransactionList;

        for (let item in result.Items) {
            let row = {} as UserTransaction;
            for (let key in result.Items[item]) {
                row[key] = result.Items[item][key];
            }
            // @ts-ignore
            resultDto.push(unmarshall(row));
        }

        // @ts-ignore
        return resultDto;
    }

    async getUserFiatTransactions({
        userId,
    }: GetUserTransactionsInputDto): Promise<Array<FiatHistory>> {
        const scanTable = new ScanCommand({
            TableName: `${process.env.NODE_ENV}-Transaction-Status`,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': { S: userId } },
        });

        const result = await this.DatabaseService.client.send(scanTable);
        let resultDto = [] as FiatHistory[];
        if (!result.Count) return resultDto;

        for (let item in result.Items) {
            let row = {} as UserTransaction;
            for (let key in result.Items[item]) {
                row[key] = result.Items[item][key];
            }
            // @ts-ignore
            resultDto.push(unmarshall(row));
        }

        resultDto.sort((txnA, txnB) => txnA.createdAt - txnB.createdAt);
        const key = "txId";
        const fiatHistory = resultDto.length ? [...new Map(resultDto.map(item => [item[key], item])).values()] : [] as FiatHistory[];

        // @ts-ignore
        return fiatHistory.length ? fiatHistory.sort((txnA, txnB) => txnB.createdAt - txnA.createdAt) : [] as FiatHistory[];
    }

    async createUserTransaction(
        payload: CreateTransactionDto
    ): Promise<boolean> {
        const {
            exchange_rate,
            crypto_amount,
            fiat_symbol,
            failure_code,
            failure_desc,
            crypto_symbol,
            status,
            fiat_amount,
            txId,
            userId,
            transaction_type,
            bank_transaction_id,
            source_id,
            txn_hash,
            address,
            network,
            account_no,
            // initTime
        } = payload;
        const putItemCommand = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-Transaction-Status`,
            Item: marshall({
                exchange_rate,
                crypto_amount,
                fiat_symbol,
                failure_code,
                failure_desc,
                crypto_symbol,
                status,
                fiat_amount,
                txId,
                userId,
                transaction_type,
                bank_transaction_id,
                source_id,
                txn_hash,
                address,
                network,
                account_no,
                initTime: payload.initTime ? payload.initTime : 0,
                createdAt: Date.now(),
            }),
        });
        await this.DatabaseService.client.send(putItemCommand);
        return true;
    }

    async sendTransactionStatus(
        txId,
        payload: SendTransactionInputDto
    ): Promise<boolean> {
        const { status } = payload;
        await this.DatabaseService.client.send(
            new PutItemCommand({
                TableName: `${process.env.NODE_ENV}-Transaction-Status`,
                Item: {
                    txId: { S: txId },
                    status: { S: status },
                    createdAt: { N: `${Date.now()}` },
                },
            })
        );

        return true;
    }
}
