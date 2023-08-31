import { Test, TestingModule } from '@nestjs/testing';
import { VoiceStateUpdateService } from './voice-state-update.service';
import { describe, expect, it, beforeEach } from '@jest/globals';

describe('VoiceStateUpdateService', () => {
  let service: VoiceStateUpdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceStateUpdateService],
    }).compile();

    service = module.get<VoiceStateUpdateService>(VoiceStateUpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
