import { Test, TestingModule } from '@nestjs/testing';
import { MultisigService } from './multisig.service';

describe('MultisigService', () => {
  let service: MultisigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultisigService],
    }).compile();

    service = module.get<MultisigService>(MultisigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
