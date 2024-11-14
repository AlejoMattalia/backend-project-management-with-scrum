import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import * as moment from 'moment';
import * as jwt from "jwt-simple"

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (!req.headers.authorization) {
      throw new UnauthorizedException("La petición no tiene cabecera de autenticación");
    }

    // Limpiar token
    let token = req.headers.authorization.replace(/['"]+/g, "");

    try {
      console.log(token);
      // Cambia 'secret' por tu clave secreta
      const payload = jwt.decode(token, process.env.JWT_SECRET); 

      if (payload.exp <= moment().unix()) {
        res.status(403).json({
          status: "Error",
          message: "Token expirado",
        });
        return;
      }

      req.user = payload;

      console.log(req.user);
      next();
    } catch (err) {
      res.status(403).json({
        status: "Error",
        message: "Token invalido",
        err
      });
    }
  }
}
