import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProcessorTokenDto } from '@badgebuddy/common';

@Injectable()
export class AuthApiService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(discordUserSId: string): string {
    return this.jwtService.sign({
      sessionId: crypto.randomUUID().toString(),
      discordUserSId,
    } as ProcessorTokenDto);
  }
}
