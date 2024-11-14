import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, } from '@nestjs/common';
import { prisma } from 'src/database';
import { FriendsGateway } from './friend.gateway';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendsGateway: FriendsGateway) { }

  // Endpoint para obtener los usuarios para agregar de amigos
  @Get("users/:userId")
  async getUsers(@Param('userId') userId: string) {
    try {
      // Obtener los usuarios sugeridos (máximo 3)
      const suggestedUsers = await prisma.user.findMany({
        take: 3,
        where: {
          id: {
            not: userId,
          },
          friends: {
            none: {
              friendId: userId,
              status: { in: ["accepted", "pending"] },
            },
          },
          friendOf: {
            none: {
              userId: userId,
              status: { in: ["accepted", "pending"] },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          image_url: true,
        },
      });

      // Obtener todos los usuarios, excluyendo tanto al usuario actual como a los usuarios sugeridos
      const users = await prisma.user.findMany({
        where: {
          id: {
            notIn: suggestedUsers.map(user => user.id).concat(userId),
          },
          friends: {
            none: {
              friendId: userId,
              status: { in: ["accepted", "pending"] },
            },
          },
          friendOf: {
            none: {
              userId: userId,
              status: { in: ["accepted", "pending"] },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          image_url: true,
        },
      });

      return {
        status: 'success',
        suggestedUsers,
        users,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al obtener los usuarios',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Obtener las solicitudes pendientes de un usuario
  @Get('pending/:userId')
  async getPendingFriendRequests(@Param('userId') userId: string) {

    try {
      // Obtener todas las solicitudes pendientes para el usuario
      const pendingRequests = await prisma.friend.findMany({
        where: {
          friendId: userId,
          status: 'pending',
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image_url: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Ordenar por fecha de creación
        },
      });

      // Contar las solicitudes pendientes
      const count = pendingRequests.length;

      // Crear un array de usuarios con información adicional
      const usersWithCount = pendingRequests.map((request) => ({
        ...request.user,
        friendRequestId: request.id,
        requestCreatedAt: request.createdAt,
      }));

      return { count, users: usersWithCount };
    }
    catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al obtener las solicitudes pendientes',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

  }

  // Enviar una solicitud de amistad
  @Post('add')
  async sendFriendRequest(
    @Body('userId') userId: string,
    @Body('friendId') friendId: string
  ) {

    if (!userId || !friendId) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: 'Todos los campos son obligatorios',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (userId === friendId) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: 'No puedes enviar una solicitud de amistad a ti mismo',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verificar si la solicitud ya existe y esta en pendiente
    const existingFriendRequest = await prisma.friend.findFirst({
      where: {
        userId: userId,
        friendId: friendId,
        status: 'pending',
      },
    });

    if (existingFriendRequest) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: 'Ya tienes una solicitud de amistad pendiente en espera.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }


    const friendRequest = await prisma.friend.create({
      data: {
        userId: userId, // ID del usuario que envía la solicitud
        friendId: friendId, // ID del usuario que recibe la solicitud
        status: 'pending',
      },
    });

    // Emitir la notificación de WebSocket al receptor de la solicitud
    this.friendsGateway.notifyNewFriendRequest(friendId);

    // Retornar la solicitud de amistad creada
    return friendRequest;
  }

  // Eliminar/rechazar una solicitud de amistad
  @Delete('delete/:userId/:friendId')
  async deleteFriendRequest(
    @Param('userId') userId: string,
    @Param('friendId') friendId: string) {
    try {

      if (!friendId || !userId) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'Todos los campos son obligatorios',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const deletedFriendRequest = await prisma.friend.deleteMany({
        where: {
          OR: [
            {
              userId: userId,
              friendId: friendId,
            },
            {
              userId: friendId,
              friendId: userId,
            },
          ],
        },
      });

      this.friendsGateway.notifyFriendRequestRejected(userId);
      return deletedFriendRequest;
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al eliminar la solicitud de amistad',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Aceptar una solicitud de amistad
  @Patch('accept/:userId/:friendId')
  async acceptFriendRequest(
    @Param('userId') userId: string,
    @Param('friendId') friendId: string
  ) {
    try {

      if (!friendId || !userId) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'Todos los campos son obligatorios',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const acceptedFriendRequest = await prisma.friend.updateMany({
        where: {
          OR: [
            {
              userId: userId,
              friendId: friendId,
            },
            {
              userId: friendId,
              friendId: userId,
            },
          ],
        },
        data: {
          status: 'accepted',
        },
      });

      return acceptedFriendRequest;
    }
    catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al aceptar la solicitud de amistad',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  // Obtener amigos
  @Get('friends/:userId')
  async getFriends(@Param('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'Todos los campos son obligatorios',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const friends = await prisma.friend.findMany({
        where: {
          userId: userId,
          status: 'accepted',
        },
        select: {
          friend: {
            select: {
              id: true,
              name: true,
              image_url: true,
              email: true,
            },
          },
        },
      });

      // Map the result to extract only the friend details
      return friends.map((friend) => friend.friend);
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al obtener los amigos',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

}
