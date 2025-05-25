import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/modules/auth/auth.guard';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  getChatHistory(
    @Query('userId1') userId1: number,
    @Query('userId2') userId2: number,
  ) {
    return this.chatService.getMessages(userId1, userId2);
  }
}
