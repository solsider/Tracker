import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { UsersService, SafeUser } from '../users/users.service';
import { RegisterDto, LoginDto } from './auth.dto';

const ACCESS_TOKEN_TTL = 15 * 60;        // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 3600; // 7 days in seconds

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private generateTokens(userId: string, email: string): TokenPair {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: `${process.env.JWT_SECRET}_refresh`,
      }),
    };
  }

  private stripSensitive(user: any): SafeUser {
    const { password: _, twoFactorSecret: __, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto): Promise<{ tokens: TokenPair; user: SafeUser }> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      ...(dto.systemRole ? { systemRole: dto.systemRole } : {}),
    });

    return { tokens: this.generateTokens(user.id, user.email), user: this.stripSensitive(user) };
  }

  async login(dto: LoginDto): Promise<{ tokens: TokenPair; user: SafeUser }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) throw new UnauthorizedException('Two-factor code required');
      const isValid = this.usersService.verifyTOTP(user.twoFactorSecret!, dto.twoFactorCode);
      if (!isValid) throw new UnauthorizedException('Invalid two-factor code');
    }

    return { tokens: this.generateTokens(user.id, user.email), user: this.stripSensitive(user) };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: SafeUser }> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: `${process.env.JWT_SECRET}_refresh`,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    return { accessToken, user: this.stripSensitive(user) };
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.stripSensitive(user);
  }
}
