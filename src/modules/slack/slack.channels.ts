import { config } from 'dotenv';

config();

type SlackChannelName = 'IndiGG_OTP';
type SlackChannelValue = string;

/**
 * Dictionary of Slack channels and their ids
 */
export const SlackChannels: Record<SlackChannelName, SlackChannelValue> = {
    IndiGG_OTP: process.env.INDIGG_OTP_CHANNEL_ID,
};
