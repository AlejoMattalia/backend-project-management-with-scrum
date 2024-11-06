import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as jwt from 'jwt-simple';
import * as moment from 'moment';

jest.mock('jwt-simple');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should create a token with the correct payload', () => {
    const user = {
      id: '1',
      name: 'Alejo Mattalia',
      email: 'alejoomattalia@gmail.com',
      password: '123456',
      image_url: 'https://res.cloudinary.com/dl6igxwvo/image/upload/v1709671637/potfolio-empresa/imagenMia2_soddyw.jpg',
    };

    const expectedPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      image_url: user.image_url,
      iat: moment().unix(),
      exp: moment().add(30, "days").unix(),
    };

    (jwt.encode as jest.Mock).mockReturnValue('mocked_token');

    const token = service.createToken(user);

    expect(jwt.encode).toHaveBeenCalledWith(expectedPayload, process.env.JWT_SECRET);
    expect(token).toBe('mocked_token');
  });
});
