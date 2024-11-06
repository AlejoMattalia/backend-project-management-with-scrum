import { Injectable } from '@nestjs/common';
import { User } from './auth.interface';
import * as moment from 'moment';
import * as jwt from "jwt-simple"

@Injectable()
export class AuthService {
    createToken(user: User) {
        
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            image_url: user.image_url,
            iat: moment().unix(),
            exp: moment().add(30, "days").unix()
          }

        return jwt.encode(payload, process.env.JWT_SECRET);
    }
}
