import { Injectable } from '@nestjs/common';
import { NotificationService } from './interfaces/firebase.service.interface';
import { SendNotificationDto } from './dto';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements NotificationService {
    private firebase: admin.app.App;
    private readonly projectId: string = process.env.FIREBASE_PROJECT_ID;
    private readonly privateKey: string = 'process.env.FIREBASE_PRIVATE_KEY';
    // private readonly privateKey: string = process.env.FIREBASE_PRIVATE_KEY;
    private readonly clientEmail: string = process.env.FIREBASE_CLIENT_EMAIL;
    private readonly firebaseAccountCredentials = {
        "project_id": this.projectId,
        // "private_key": Buffer.from(this.privateKey, 'base64').toString('ascii'),
        "private_key": this.privateKey,
        "client_email": this.clientEmail,
    }
    private readonly serviceAccount = this.firebaseAccountCredentials as admin.ServiceAccount

    constructor() {
        this.firebase = admin.initializeApp({credential: admin.credential.cert(this.serviceAccount)})
        
    }

    async sendNotification({ title, body, refreshToken }: SendNotificationDto): Promise<void> {
        const payload = {
            notification: {
              title: title,
              body: body
            }
          };

        const options = {
            priority: "high",
            timeToLive: 60 * 60 *24
          };

        this.firebase.messaging().sendToDevice(refreshToken, payload, options)
        .then(function(response) {
            console.log("Successfully sent message:", JSON.stringify(response));
            return true
        })
        .catch(function(error) {
            console.log("Error sending message:", error);
            return false
        });
    }
}
