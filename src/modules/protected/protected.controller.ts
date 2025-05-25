import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Controller('protected')
export class ProtectedController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async getProtected(@Req() req) {

    return {
      message: 'You have accessed a protected route!',
      user: req.user,
    };
  }
}
