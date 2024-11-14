// friends.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Manejar la conexión de un nuevo cliente
  handleConnection(client: Socket) {
    console.log('Nuevo cliente conectado');
    const userId = client.handshake.query.userId;
    client.join(userId); // El usuario se une a una sala con su ID
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado');
    const userId = client.handshake.query.userId as string;
    client.leave(userId);
  }

  // Emitir una nueva solicitud de amistad
  notifyNewFriendRequest(friendId: string) {
    console.log('Notificando nueva solicitud de amistad');
    this.server.to(friendId).emit('newFriendRequest');
  }

  // Emitir una solicitud de amistad rechazada
  notifyFriendRequestRejected(friendId: string) {
    console.log('Notificando solicitud de amistad rechazada');
    this.server.to(friendId).emit('friendRequestRejected');
  }
}
