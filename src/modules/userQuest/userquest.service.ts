import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { CognitoService } from '@modules/cognito/cognito.service';
import { DatabaseService } from '@modules/database/database.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {UserQuestDto} from './userquest.dtos';
AWS.config.update({ region: process.env.AWS_REGION });
var ebevents = new AWS.EventBridge({apiVersion: '2015-10-07'});

@Injectable()
export class UserQuestService {
  constructor(
      private readonly CognitoService: CognitoService,
      private readonly DatabaseService: DatabaseService,
  ) { }

  async passEvent(event: UserQuestDto): Promise<any> {
    try {
        // const eventbridge = new AWS.EventBridge();

        // // Prepare the event to send
        // const params = {
        //     Source: 'questState',
        //     DetailType: event.detailType,
        //     Detail: JSON.stringify({uid:event.detail.uid}),
        //     EventBusName: `arn:aws:events:eu-west-1:035475678676:event-bus/PreProdStage-StateManagerEventBus`,
        // };

        // // Send the event
        // const data = await eventbridge
        //     .putEvents({ Entries: [params] })
        //     .promise();
        // console.log(
        //     'This message would be returned to the frontend: ',
        //     data
        // );
        // return data.Entries;
    } catch (err) {
        console.log('Error: ', err);
    }
  }
}
