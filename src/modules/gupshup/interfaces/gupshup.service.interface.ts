import { SendSMSDto } from '../dto/send-sms.dto';

export interface SMSService {
    /**
     * Sends a SMS message to the specified phone number
     * @param {SendSMSDto} request User phone number and message
     */
    sendSMS(request: SendSMSDto): Promise<boolean>;
}
