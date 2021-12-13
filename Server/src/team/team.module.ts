import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrbitModule } from '../orbit/orbit.module';
import { TeamController } from './team.controller';
import { Team } from './team.entity';
import { TeamService } from './team.service';

@Module({
  imports:[TypeOrmModule.forFeature([Team]),OrbitModule],
  controllers: [TeamController],
  providers: [TeamService]
})
export class TeamModule {}
