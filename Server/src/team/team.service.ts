import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { escaper } from '../utils/html-escaper';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto';
import { Team } from './team.entity';
import { OrbitService } from '../orbit/orbit.service';

@Injectable()
export class TeamService {
    constructor(@InjectRepository(Team) private readonly teamRepo: Repository<Team>, private orbitService: OrbitService) { }

    async createTeam(accountId: string, dto: CreateTeamDto) {
        try {
            await this.orbitService.config()

            const { result: isExist } = await this.orbitService.findTeam(accountId, dto.title, "title")
            if (isExist) throw new HttpException("You already use this title", HttpStatus.BAD_REQUEST);

            const { result } = await this.orbitService.addTeam(accountId, dto.title)
            return { result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTeam(teamId: string, accountId: string) {
        try {
            await this.orbitService.config()

            const { result } = await this.orbitService.findTeam(accountId, teamId, "id")
            if (!result) throw new HttpException("There is not any team belong this account", HttpStatus.BAD_REQUEST);


            return { ...result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTeams(accountId: string) {
        try {
            await this.orbitService.config()
            let { result: teams } = await this.orbitService.getTeams(accountId)
            teams = teams && teams.map(team => {
                return { id: team.id, title: team.title }
            })

            return { teams, total: teams.lengt }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async isTeamNameExist(accountId: string, teamName: string) {
        try {
            const team = await this.orbitService.findTeam(accountId, teamName, "title")
            let result = team ? true : false;
            return { result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTeamsWithMembers(accountId: string, take: number = 10, skip: number = 0) {
        try {
            await this.orbitService.config()
            let { result: teams } = await this.orbitService.getTeams(accountId)
            return { teams, total: teams.length }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateTeam(dto: CreateTeamDto, accountId: string, teamId: string) {
        try {
            await this.orbitService.config()

            await this.orbitService.updateTeam(accountId, teamId, dto.title)
            return { id: teamId, title: dto.title }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteTeam(accountId: string, teamId: string) {
        try {
            await this.orbitService.config()

            await this.orbitService.removeTeam(accountId, teamId)
            return { message: 'Deleted successfully' }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
