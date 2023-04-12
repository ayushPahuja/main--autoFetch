import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
    public readonly client: DynamoDBClient;

    constructor() {
        this.client = new DynamoDBClient({ region: process.env.AWS_REGION });
    }
}
