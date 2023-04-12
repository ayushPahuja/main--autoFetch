import { SendNotificationDto } from '../dto';

export interface NotificationService {
    /**
     * Sends a notification to the specified device
     * @param {SendNotificationDto} request User firebase token and notification title and body
     */
    sendNotification(request: SendNotificationDto): Promise<void>;
}
