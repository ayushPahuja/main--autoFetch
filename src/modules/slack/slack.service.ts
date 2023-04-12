import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { PostMessageDto } from './dto';
import { ISlackService } from './interfaces/slack.service.interface';

@Injectable()
export class SlackService implements ISlackService {
    private client: WebClient;

    constructor() {
        this.client = new WebClient(process.env.SLACK_AUTH_TOKEN!);
    }

    async postMessageInChat({ channel, text }: PostMessageDto): Promise<void> {
        await this.client.chat.postMessage({
            channel: channel,
            text: text,
            token: process.env.SLACK_AUTH_TOKEN,
        });
    }
}
