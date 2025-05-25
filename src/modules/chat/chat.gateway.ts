import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapping of socket.id -> userId
  private socketUserMap = new Map<string, number>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.socketUserMap.delete(client.id);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (!userId) {
      client.emit('error', { message: 'userId is required to join room.' });
      return;
    }

    client.join(userId.toString());
    this.socketUserMap.set(client.id, userId);

    console.log(`Client ${client.id} joined room ${userId}`);
    client.emit('joined_room', { userId });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = this.socketUserMap.get(client.id);

    if (!senderId) {
      client.emit('error', { message: 'You must join a room first to send messages.' });
      return;
    }

    const { receiverId, content } = data;

    if (!receiverId || !content) {
      client.emit('error', { message: 'receiverId and content are required.' });
      return;
    }

    const messageDto: CreateMessageDto = {
      senderId,
      receiverId,
      content,
    };

    const savedMessage = await this.chatService.createMessage(messageDto);

    // Send to the receiver's room
    this.server.to(receiverId.toString()).emit('receive_message', savedMessage);

    // Confirm back to the sender
    client.emit('message_sent', savedMessage);
  }
}



// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import {
//     OnGatewayConnection,
//     OnGatewayDisconnect,
//     SubscribeMessage,
//     WebSocketGateway,
//     WebSocketServer,
// } from '@nestjs/websockets';
// import * as jwt from 'jsonwebtoken';
// import { Server, Socket } from 'socket.io';
// import { InjectEntityManager } from '@nestjs/typeorm';
// import { EntityManager } from 'typeorm';
// import { validateUser } from 'src/shared/services/helper';

// @WebSocketGateway({ namespace: '/chat', cors: true })
// @Injectable()
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer() server: Server;
//     private logger: Logger = new Logger('ChatGateway');

//     constructor(
//       @InjectEntityManager()
//       private readonly entityManager: EntityManager,
//   ) {}

//     async handleConnection(client: Socket) {
//         try {
//             const userPayload = this.authenticateSocket(client);
//             await this.initializeUserConnection(userPayload, client);
//             const userId = userPayload.userID;

//             if (userId) {
//                 this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
//             } else {
//                 throw new Error('Invalid user ID');
//             }
//         }
//         catch (error) {
//             this.handleConnectionError(client, error);
//         }
//     }

//     handleDisconnect(client: Socket) {
//         this.logger.log(`Client disconnected: ${client.id}`);
//     }

//     @SubscribeMessage('joinRoom')
//     handleJoinRoom(client: Socket, payload: { chatId: number }): void {
//         try {
//             const userId = this.getUserIdFromClient(client);
//             if (!userId) {
//                 throw new BadRequestException('Invalid user');
//             }
//             const { chatId } = payload;
//             if (!chatId) {
//                 throw new BadRequestException('Chat ID is required');
//             }
//             client.join(chatId.toString());
//             this.logger.log(`User ${userId} joined chat room: ${chatId}`);
//         } catch (error) {
//             this.logger.error(`Error joining room: ${error.message}`, error.stack);
//             client.emit('error', { message: error.message });
//         }
//     }

//     @SubscribeMessage('sendMessage')
//     async handleMessage(
//         client: Socket,
//         payload: { chatId: number; message?: string; fileData?: any; messageType: number; fileName?: string }
//     ): Promise<void> {
//         try {
//             const senderUserId = this.getUserIdFromClient(client);
//             if (!senderUserId) {
//                 throw new BadRequestException('Invalid sender');
//             }

//             const { chatId, message, fileData, messageType, fileName } = payload;

//             if (messageType === 1 && !message) {
//                 throw new BadRequestException('Message content is required for text messages');
//             }
//             if (messageType === 2 && (!fileData || !fileName)) {
//                 throw new BadRequestException('File data and filename are required for file attachments');
//             }

//             let emitPayload: any;
//             if (messageType === 1) {
//                 emitPayload = {
//                     chatId,
//                     message,
//                     messageType,
//                     senderUserId: Number(senderUserId),
//                 };
//             } else if (messageType === 2) {
//                 emitPayload = {
//                     chatId,
//                     fileName,
//                     filePath: fileData,
//                     messageType,
//                     senderUserId: Number(senderUserId),
//                 };
//             }
//             this.server.to(chatId.toString()).emit('message', emitPayload);
//             this.logger.log(`Emitted message to chat ID: ${chatId}`, emitPayload);
//         } catch (error) {
//             this.logger.error(`Error handling message: ${error.message}`, error.stack);
//             client.emit('error', { message: error.message });
//         }
//     }

//     private authenticateSocket(socket: Socket): any {

//         const token = this.extractJwtToken(socket);
//         if (!token) throw new Error('No token provided');

//         const secretKey = process.env.JWT_SECRET_KEY;
//         if (!secretKey) throw new Error('JWT secret key not set');

//         const keyBytes = Buffer.from(secretKey, 'base64');
//         const decodedToken: any = jwt.verify(token, keyBytes, { algorithms: ['HS256'] });

//         return decodedToken;
//     }

//     private extractJwtToken(socket: Socket): string {
//         const authHeader = socket.handshake.headers.authorization;
//         if (!authHeader) {
//             throw new Error('No authorization header found');
//         }

//         const [bearer, token] = authHeader.split(' ');
//         if (bearer !== 'Bearer' || !token) {
//             throw new Error('Invalid or missing token');
//         }

//         return token;
//     }

//     private async initializeUserConnection(userPayload: any, socket: Socket) {
//         const user = await validateUser(userPayload.sub, this.entityManager);
//         if (!user) {
//             throw new Error('User not found');
//         }
//         socket.data.user = user;
//     }

//     private handleConnectionError(socket: Socket, error: Error): void {
//         this.logger.warn(`Socket connection error. Socket ID: ${socket.id}, Error: ${error.message}`);
//         socket.emit('error', { message: 'Authentication error: ' + error.message });
//         socket.disconnect();
//     }

//     private getUserIdFromClient(client: Socket): string {
//         const user = client.data.user;
//         return user ? user.userID : null;
//     }
// }
