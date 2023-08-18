import { Test, TestingModule } from '@nestjs/testing';
import { ProcessorsService } from './processors.service';

describe('ProcessorsService', () => {
  let service: ProcessorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessorsService],
    }).compile();

    service = module.get<ProcessorsService>(ProcessorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
