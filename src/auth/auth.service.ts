import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jwt-simple';
import * as moment from 'moment';
import { User } from './auth.interface';

@Injectable()
export class AuthService {
  // Método para crear un token
  createToken(user: User) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      image_url: user.image_url,
      iat: moment().unix(),
      exp: moment().add(30, 'days').unix(),
    };

    return jwt.encode(payload, process.env.JWT_SECRET);
  }

  // Método para decodificar el token y devolver el usuario
  decodeToken(token: string): User {
    try {
      const decoded = jwt.decode(token, process.env.JWT_SECRET);

      // Verificar si el token ha expirado
      if (decoded.exp <= moment().unix()) {
        throw new UnauthorizedException('Token ha expirado');
      }

      // Retornar el usuario decodificado
      const user: User = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        image_url: decoded.image_url,
      };

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
