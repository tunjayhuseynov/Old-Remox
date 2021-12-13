import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrbitModule } from '../orbit/orbit.module';
import { Team } from '../team/team.entity';
import { TeamMemberController } from './team-member.controller';
import { TeamMember } from './team-member.entity';
import { TeamMemberService } from './team-member.service';

@Module({
    imports: [TypeOrmModule.forFeature([TeamMember,Team]),OrbitModule],
    controllers: [TeamMemberController],
    providers: [TeamMemberService]
})
export class TeamMemberModule { }
