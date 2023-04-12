import {
    ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { DatabaseService } from '@modules/database/database.service';
import {
    Injectable,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { CollegesList } from './colleges.dtos';

@Injectable()
export class CollegesService {
    constructor(private readonly DatabaseService: DatabaseService) {}

    async getColleges(
        
    ): Promise<CollegesList> {
        const scanItemCommand = new ScanCommand({
            TableName: `${process.env.NODE_ENV}-Colleges`,
        });

        const result = await this.DatabaseService.client.send(scanItemCommand);

        const resultDto: CollegesList = [] as CollegesList;

        if (!result.Count) return [] as CollegesList;

        for (const item of result.Items) {
            const marshalled: any = AWS.DynamoDB.Converter.unmarshall(item);
            resultDto.push(marshalled);
        }

        return resultDto;
    }
}