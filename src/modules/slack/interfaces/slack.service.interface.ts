import { PostMessageDto } from '../dto';

export interface ISlackService {
    /**
     * Posts a text message in the specified Slack channel
     * @param {PostMessageDto} request Channel to post in and the text message
     */
    postMessageInChat(request: PostMessageDto): Promise<void>;
}
