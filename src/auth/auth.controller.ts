import { Body, Controller, Post, BadRequestException, HttpException, HttpStatus, Get, UnauthorizedException, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-auth.dto';
import { prisma } from 'src/database';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-auth.dto';
import { User } from './auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register')
  async register(@Body() params: RegisterDto) {

    try {

      const { name, email, password, image_url } = params;

      // Validar los datos
      if (!name || !email || !password || !image_url) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'Todos los campos son requeridos',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar si el correo electrónico ya existe
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'El correo electrónico ya existe.',
          },
          HttpStatus.BAD_REQUEST,
        );
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

    catch (error) {
      console.log(error)
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al registrar el usuario',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

  }



  @Post('/login')
  async login(@Body() params: LoginDto) {
    const { email, password } = params;

    // Validar los campos
    if (!email || !password) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: 'Todos los campos son requeridos.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Verificar si el correo electrónico existe
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'El correo electrónico no existe.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new HttpException(
          {
            status: 'error',
            code: 400,
            message: 'La contraseña es incorrecta.',
          },
          HttpStatus.BAD_REQUEST,
        );
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
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al iniciar sesión',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Get('/user')
  async getUser(@Headers('Authorization') authorization: string): Promise<User> {
    try {
      if (!authorization) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authorization;
      return this.authService.decodeToken(token);
    }
    catch (error) {
      throw new HttpException(
        {
          status: 'error',
          code: 400,
          message: error.message || 'Error al obtener el usuario',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

  }
  

}
