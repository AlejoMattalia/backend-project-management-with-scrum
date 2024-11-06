import { Body, Controller, Post, BadRequestException} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-auth.dto';
import { prisma } from 'src/database';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() params: RegisterDto) {

    try{

      const { name, email, password, image_url } = params;

      // Validar los datos
      if (!name || !email || !password || !image_url) {
        return {
          status: 'error',
          code: 400,
          message: 'Todos los campos son requeridos.'
        }
      }
  
  
      // Verificar si el correo electrónico ya existe
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return {
          status: 'error',
          code: 400,
          message: 'El correo electrónico ya existe.'
        }
      }
  

      //Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(params.password, 10);
      params.password = hashedPassword;

  
      //Crear el usuario
      const user = await prisma.user.create({
        data: params
      });

      // Crear el token
      const token = this.authService.createToken(user);


      // Excluir la contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = user;

      return {
        status: 'success',
        code: 200,
        message: 'Registro exitoso',
        user: userWithoutPassword,
        token
      };

    }
    catch(error){
      console.log(error)
      return {
        status: 'error',
        code: 400,
        message: 'Error al registrar el usuario'
      }
    }
  }



  @Post('/login')
  async login(@Body() params: LoginDto) {
    try{

      const { email, password } = params;

      if(!email || !password){
        return {
          status: 'error',
          code: 400,
          message: 'Todos los campos son requeridos.'
        }
      }


      // Verificar si el correo electrónico existe
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return {
          status: 'error',
          code: 400,
          message: 'El correo electrónico no existe.'
        }
      }


      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          status: 'error',
          code: 400,
          message: 'La contraseña es incorrecta.'
        }
      }


      // Crear el token 
      const token = this.authService.createToken(user);

      // Excluir la contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = user;

      return {
        status: 'success',
        code: 200,
        message: 'Inicio de sesión exitoso',
        user: userWithoutPassword,
        token
      };

    }
    catch(error){
      console.log(error)
      return {
        status: 'error',
        code: 400,
        message: 'Error al iniciar sesión'
      }
    }
  }
}
