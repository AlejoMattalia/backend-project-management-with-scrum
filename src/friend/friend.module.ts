import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendsGateway } from './friend.gateway';
import { AuthMiddleware } from 'src/utils/auth';

@Module({
  controllers: [FriendController],
  providers: [FriendsGateway],
})
export class FriendModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/friend/*');
  }
}
