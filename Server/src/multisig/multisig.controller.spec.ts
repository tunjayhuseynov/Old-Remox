import { Test, TestingModule } from '@nestjs/testing';
import { MultisigController } from './multisig.controller';

describe('MultisigController', () => {
  let controller: MultisigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultisigController],
    }).compile();

    controller = module.get<MultisigController>(MultisigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
