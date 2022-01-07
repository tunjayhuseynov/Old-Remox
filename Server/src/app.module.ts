import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm'
import { TransactionModule } from './transaction/transaction.module';
import {devConfig, prodConfig} from './config/orm-config'
import { AccounModule } from './account/account.module';
import { CustumerModule } from './custumer/custumer.module';
import { TeamModule } from './team/team.module';
import { TeamMemberModule } from './team-member/team-member.module';
import { OrbitModule } from './orbit/orbit.module';
import { MultisigModule } from './multisig/multisig.module';

//const databaseConfig = process.env.NODE_ENV == 'production' ? prodConfig : devConfig
@Module({
  imports: [
    TypeOrmModule.forRoot(devConfig),
    TransactionModule,
    AccounModule,
    CustumerModule,
    TeamModule,
    TeamMemberModule,
    OrbitModule,
    MultisigModule
  ]
})
export class AppModule { }
