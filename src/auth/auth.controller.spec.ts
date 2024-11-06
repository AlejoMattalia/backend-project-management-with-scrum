import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { prisma } from 'src/database'; // Importa tu cliente de Prisma
import * as bcrypt from 'bcrypt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    createToken: jest.fn().mockReturnValue('mocked_token'),
  };

  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        // No se necesita un provider para PrismaClient, usaremos un mock directamente
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    // Reiniciar los mocks antes de cada prueba
    jest.clearAllMocks();
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(mockPrismaClient.user.findUnique);
    jest.spyOn(prisma.user, 'create').mockImplementation(mockPrismaClient.user.create);
    jest.spyOn(bcrypt, 'hash'); // Asegúrate de espiar bcrypt.hash
    jest.spyOn(bcrypt, 'compare'); // Asegúrate de espiar bcrypt.compare
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto: RegisterDto = {
        name: 'Alejo Mattalia',
        email: 'alejoomattalia@gmail.com',
        password: 'password123',
        image_url: 'http://example.com/image.jpg',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(null); // No hay usuario existente
      mockPrismaClient.user.create.mockResolvedValue({ ...registerDto, password: 'hashed_password' });

      // Simulamos que bcrypt.hash es llamada con éxito
      jest.spyOn(bcrypt, 'hash').mockImplementation(
        async (password: string, saltRounds: number) => 'hashed_password'
      );
      
      const result = await controller.register(registerDto);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        message: 'Registro exitoso',
        user: { name: 'Alejo Mattalia', email: 'alejoomattalia@gmail.com', image_url: 'http://example.com/image.jpg' },
        token: 'mocked_token',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10); // Verifica que la contraseña fue encriptada
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({ data: { ...registerDto, password: expect.any(String) } });
    });

    it('should return an error if email already exists', async () => {
      const registerDto: RegisterDto = {
        name: 'Alejo Mattalia',
        email: 'alejoomattalia@gmail.com',
        password: 'password123',
        image_url: 'http://example.com/image.jpg',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({}); // Usuario ya existe

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        status: 'error',
        code: 400,
        message: 'El correo electrónico ya existe.',
      });
    });

    it('should return an error if required fields are missing', async () => {
      const registerDto: RegisterDto = {
        name: '',
        email: '',
        password: '',
        image_url: '',
      };

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        status: 'error',
        code: 400,
        message: 'Todos los campos son requeridos.',
      });
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'alejoomattalia@gmail.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        name: 'Alejo Mattalia',
        email: 'alejoomattalia@gmail.com',
        password: await bcrypt.hash('password123', 10),
        image_url: 'http://example.com/image.jpg',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(user);
      
      // Simulamos la comparación de contraseñas
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (password: string, hashedPassword: string) => {
        return password === 'password123'; // Aquí puedes simular el resultado deseado
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        message: 'Inicio de sesión exitoso',
        user: { id: '1', name: 'Alejo Mattalia', email: 'alejoomattalia@gmail.com', image_url: 'http://example.com/image.jpg' },
        token: 'mocked_token',
      });
    });

    it('should return an error if password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'alejoomattalia@gmail.com',
        password: 'wrongpassword',
      };

      const user = {
        id: '1',
        name: 'Alejo Mattalia',
        email: 'alejoomattalia@gmail.com',
        password: await bcrypt.hash('password123', 10),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(user);
      
      // Simulamos contraseña incorrecta
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (password: string, hashedPassword: string) => {
        return false; // Simulando contraseña incorrecta
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        status: 'error',
        code: 400,
        message: 'La contraseña es incorrecta.',
      });
    });

    it('should return an error if required fields are missing', async () => {
      const loginDto: LoginDto = {
        email: '',
        password: '',
      };

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        status: 'error',
        code: 400,
        message: 'Todos los campos son requeridos.',
      });
    });
  });

});
