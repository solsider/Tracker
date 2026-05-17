import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  password: 'hashed-password',
  twoFactorEnabled: false,
  twoFactorSecret: null,
  systemRole: 'DEVELOPER' as const,
  position: null,
  department: null,
  timezone: 'Europe/Moscow',
  language: 'ru',
  bio: null,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { verifyTOTP: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a user and returns a token', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser as any);

      const result = await service.register({
        email: 'alice@test.com',
        name: 'Alice',
        password: 'password123',
      });

      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('twoFactorSecret');
      expect(result.user.email).toBe('alice@test.com');
    });

    it('hashes the password before storing', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser as any);

      await service.register({
        email: 'alice@test.com',
        name: 'Alice',
        password: 'plaintext',
      });

      const [createArg] = usersRepository.create.mock.calls[0];
      expect(createArg.password).not.toBe('plaintext');
      const isHashed = await bcrypt.compare('plaintext', createArg.password);
      expect(isHashed).toBe(true);
    });

    it('throws ConflictException when email is already taken', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        service.register({ email: 'alice@test.com', name: 'Alice', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('signs a JWT with sub and email claims', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser as any);

      await service.register({
        email: 'alice@test.com',
        name: 'Alice',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns token and safe user on valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      } as any);

      const result = await service.login({
        email: 'alice@test.com',
        password: 'password123',
      });

      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('alice@test.com');
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      } as any);

      await expect(
        service.login({ email: 'alice@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('requires 2FA code when twoFactorEnabled is true', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      } as any);

      await expect(
        service.login({ email: 'alice@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts valid 2FA code', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      } as any);
      usersService.verifyTOTP.mockReturnValue(true);

      const result = await service.login({
        email: 'alice@test.com',
        password: 'password123',
        twoFactorCode: '123456',
      });

      expect(result.tokens.accessToken).toBe('signed-token');
    });

    it('rejects invalid 2FA code', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      } as any);
      usersService.verifyTOTP.mockReturnValue(false);

      await expect(
        service.login({
          email: 'alice@test.com',
          password: 'password123',
          twoFactorCode: '000000',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── me ──────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('returns safe user for valid user id', async () => {
      usersRepository.findById.mockResolvedValue(mockUser as any);

      const result = await service.me('user-1');

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('twoFactorSecret');
      expect((result as any).email).toBe('alice@test.com');
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.me('ghost')).rejects.toThrow(UnauthorizedException);
    });
  });
});
