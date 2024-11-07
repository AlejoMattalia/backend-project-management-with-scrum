import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa el ConfigModule
import { AuthModule } from './auth/auth.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que las variables estén disponibles globalmente
    }),
    AuthModule,
    FriendModule,
  ],
})
export class AppModule {}
