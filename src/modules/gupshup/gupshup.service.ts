import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SMSService } from './interfaces/gupshup.service.interface';
import { SendSMSDto } from './dto';

@Injectable()
export class GupshupService implements SMSService {

    private readonly GupshupBaseUrl: string = process.env.GUPSHUP_BASE_URL;

    constructor(
        private readonly HttpService: HttpService,
    ) {}

    async sendSMS({ message, phoneNumber }: SendSMSDto): Promise<boolean> {
        try{
            const gupshupEndpoint = `${this.GupshupBaseUrl}`;
            const requestBody = 
                { 
                    "method": "sendMessage",
                    "send_to": phoneNumber,
                    "msg": message,
                    "msg_type": "Text",
                    "userid": process.env.GUPSHUP_USER_ID,
                    "auth_scheme": "Plain",
                    "password": process.env.GUPSHUP_USER_PASSWORD,
                    "format": "TEXT",
                    "v": "1.1"  
            }

            const { data } = await this.HttpService.axiosRef.post(
                gupshupEndpoint, requestBody
            );
            if(data.substring(0, data.indexOf("|")).trim() === 'error'){
                return false
            }
            return true;

        }catch(err){
            console.log("error in sending sms", err)
            return false
        }
    }
}
