import { Module } from '@nestjs/common';
import { OrbitModule } from '../orbit/orbit.module';
import { MultisigController } from './multisig.controller';
import { MultisigService } from './multisig.service';

@Module({
  imports:[OrbitModule],
  controllers: [MultisigController],
  providers: [MultisigService]
})
export class MultisigModule {}
