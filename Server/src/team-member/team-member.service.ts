import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from '../team/team.entity';
import { Repository } from 'typeorm';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto';
import { TeamMember } from './team-member.entity';
import Web3 from 'web3'
import { escaper } from '../utils/html-escaper';
import { Provider } from '../blockchain/provider';
import { OrbitService } from '../orbit/orbit.service';

@Injectable()
export class TeamMemberService {

    private web3: Web3;

    constructor(
        @InjectRepository(TeamMember) private readonly teamMemberRepo: Repository<TeamMember>,
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,private orbitService: OrbitService
    ) {

        const provider = new Provider('https://forno.celo.org')
        this.web3 = provider.web3;
    }


    async addMember(dto: CreateTeamMemberDto, accountId: string) {
        try {
            await this.orbitService.config()

            const isAddressExist = this.web3.utils.isAddress(dto.address);
            if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);

            const {result} =await this.orbitService.addMember(accountId,dto)
            return {...result,teamId:dto.teamId }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getMembersByTeam(teamId: string, accountId: string) {
        try {
            await this.orbitService.config()

            const {result:members} = await this.orbitService.getMembersByTeam(accountId,teamId)

            return { members, total:members.length }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async removeMember(memberId: string, accountId: string) {
        try {
            await this.orbitService.config()

            await this.orbitService.removeMember(accountId,memberId)
            return { message: 'Deleted successfully' }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateMember(dto: UpdateTeamMemberDto, accountId: string) {
        try {
            if (dto.address) {
                const isAddressExist = this.web3.utils.isAddress(dto.address);
                if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);
            }

            await this.orbitService.config()
            const result = await this.orbitService.updateMember(accountId,dto)

            return {...result} 
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
