import { Controller, Get } from '@nestjs/common';
import { FriendService } from './friend.service';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  findAll() {
    return "HOLA";
  }
}
