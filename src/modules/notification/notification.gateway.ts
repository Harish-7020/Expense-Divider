import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/notifications' })
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private logger: Logger = new Logger('NotificationGateway');
    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway Initialized');
    }
    
    handleConnection(client: Socket) {
        try {
            const userId = this.getUserIdFromConnection(client);
            if (userId) {
                this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
                client.join(userId);
            } else {
                this.logger.warn(`Client disconnected: ${client.id} (No valid userId)`);
                client.disconnect();
            }
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendNotification')
    handleSendNotification(client: Socket, payload: any): void {
        const userId = this.getUserIdFromConnection(client);
        if (userId) {
            this.sendNotification(payload);
        } else {
            this.logger.error('No valid userId for sending notification');
        }
    }

    sendNotification(notification: any) {
        const notificationID = notification.notificationIDs[0];
        const currentUser = notification.createdBy ? notification.createdBy.userID : null;
        let assignedUserIds: any[] = Array.isArray(notification.assignedUser) 
            ? notification.assignedUser 
            : [notification.assignedUser];
    
        const userIds = assignedUserIds.map(user => {
            if (typeof user === 'object' && user !== null) {
                return user.userID;
            }
            return user;
        });
        const uniqueUserIds = [...new Set(userIds)].filter(userID => userID !== currentUser);
        uniqueUserIds.forEach(userId => {
            this.logger.log(`Sending notificationID: ${notificationID} to userId: ${userId}`);
            this.server.to(String(userId)).emit('notification', notificationID); 
        });
    }
    
    getUserIdFromConnection(client: any): string {
        const userId = client.handshake.query.userId;
        return userId;
    }
}