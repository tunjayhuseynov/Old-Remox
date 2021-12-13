import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { escaper } from '../utils/html-escaper';
import { OrbitEntityDto, UpdateAccountDto } from '../account/dto';
import { IOrbitEntity } from './interfaces/orbit.interface'
import { AddCustumerDto } from '../custumer/dto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'
import { CreateTeamMemberDto, UpdateTeamMemberDto } from '../team-member/dto';
require('dotenv').config({ path: path.join(__dirname, "..", "..", ".env") });
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

@Injectable()
export class OrbitService {
    public db: any;
    public orbitDb: any;
    constructor() { }

    async config() {
        if (this.db != undefined) return this.db
        const ipfsOptions = {
            // start: true,
            preload: { enabled: false },
            repo: path.join(__dirname, "..", "..", "ipfs", "var"),
            EXPERIMENTAL: {
                pubsub: true
            }
        }
        // identity = process.env.IDENTITY;
        // if (!identity) {
        //     const options = { id: 'local-id' }
        //     identity = await Identities.createIdentity(options)
        //     const envIdentity = JSON.stringify(identity)
        //     fs.appendFileSync('.env', `\nIDENTITY=${envIdentity}`);
        // } else {
        //     identity = JSON.parse(identity)
        // }

        const ipfs = await IPFS.create(ipfsOptions)

        this.orbitDb = await OrbitDB.createInstance(ipfs, { directory: path.join(__dirname, "..", "..", "ipfs", "orbitdb1") })
        const optionsToWrite = {
            // create: true,
            // overwrite: true,
            // localOnly: false,
            accessController: {
                type: 'orbitdb',
                write: ["*"],
            }
        }

        this.db = await this.orbitDb.keyvalue('application.settings', optionsToWrite)
    }

    //account metods
    async addData(dto: OrbitEntityDto, id: string) {
        Object.keys(dto).forEach(key => dto[key] === undefined && delete dto[key])
        try {
            await this.db.load()
            await this.db.put(id, { ...dto }, { pin: true })
            await this.orbitDb.stop()
            return { ...dto }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findOneAccount(address: string) {
        try {
            let newDate: IOrbitEntity
            await this.db.load()
            const datas = this.db.all;
            for (const [id, data] of Object.entries(datas)) {
                newDate = data;
                if (newDate.address == address) return { id, address: newDate.address, password: newDate.password, iv: newDate.iv }
            }
            return undefined
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getData(id: string) {
        try {
            await this.db.load()
            const account = this.db.get(id)
            await this.orbitDb.stop()
            return { value: account }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async setIv(iv: string, id: string) {
        try {
            await this.db.load()
            const account = this.db.get(id)
            account.iv = iv
            await this.db.set(id, { ...account })

            await this.orbitDb.stop()
            return { iv }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async setDatas(id: string, dto: UpdateAccountDto) {
        Object.keys(dto).forEach(key => dto[key] === undefined && delete dto[key])
        const updates = Object.keys(dto);
        const allowedUpdates = ["companyName", "surname", "userName"];
        const checkedUpdates = updates.filter(items => allowedUpdates.includes(items));
        try {
            if (updates.length == 0) throw new HttpException("Please fill any form", HttpStatus.NOT_FOUND)

            await this.db.load()
            const account = this.db.get(id)

            checkedUpdates.forEach(item => account[item] = escaper(dto[item]))

            await this.db.set(id, { ...account })
            delete account['iv']
            delete account['password']
            await this.orbitDb.stop()

            return { ...account }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    ///set Time for notification//////////
    async setTime(id: string, time: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            account.notiTime = time;
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTime(id: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            await this.orbitDb.stop()
            return { time: account.notiTime }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    ///custumer metods//////////
    async addCustumer(id: string, dto: AddCustumerDto,) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            const custumerId = uuidv4()
            if (!account.custumers) {
                account.custumers = [];
                account.custumers.push({ id: custumerId, ...dto })
            } else {
                account.custumers.push({ id: custumerId, ...dto })
            }
            await this.db.set(id, { ...account })

            await this.orbitDb.stop()
            return { result: { id: custumerId, ...dto } }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findCustumer(id: string, searchedField: string, field: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.custumers ? -1 : account.custumers.findIndex(i => i[field] == searchedField)
            await this.orbitDb.stop()
            return { result: index == -1 ? undefined : account.custumers[index] }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCustumers(id: string) {
        try {
            await this.db.load()
            const account = this.db.get(id)
            await this.orbitDb.stop()
            return { result: !account.custumers ? [] : account.custumers }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async removeCustumer(id: string, custumerId: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.custumers ? -1 : account.custumers.findIndex(i => i.id == custumerId)
            if (index == -1) throw new HttpException("There is no custumer with this property", HttpStatus.BAD_REQUEST);

            account.custumers.splice(index, 1)
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    ///team metods//////////
    async addTeam(id: string, title: string) {
        try {
            await this.db.load()
            const account = this.db.get(id)
            const teamId = uuidv4()
            if (!account.teams) {
                account.teams = [];
            }

            account.teams.push({ id: teamId, title })
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()

            return { result: { id: teamId, title } }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findTeam(id: string, searchedField: string, field: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.teams ? -1 : account.teams.findIndex(i => i[field] == searchedField)
            await this.orbitDb.stop()

            return { result: index == -1 ? undefined : account.teams[index] }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTeams(id: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            await this.orbitDb.stop()

            return { result: !account.teams ? [] : account.teams }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateTeam(id: string, teamId: string, title: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.teams ? -1 : account.teams.findIndex(i => i.id == teamId)
            if (index == -1) throw new HttpException("There is no team with this property", HttpStatus.BAD_REQUEST);

            let isNameExist = account.teams.findIndex(i => i.title == title)
            if (isNameExist != -1) throw new HttpException("You already use this team name", HttpStatus.BAD_REQUEST);

            account.teams[index].title = escaper(title);
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async removeTeam(id: string, teamId: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.teams ? -1 : account.teams.findIndex(i => i.id == teamId)
            if (index == -1) throw new HttpException("There is no team with this property", HttpStatus.BAD_REQUEST);

            account.teams.splice(index, 1)
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    ///team-member metods//////////
    async addMember(id: string, dto: CreateTeamMemberDto) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.teams ? -1 : account.teams.findIndex(i => i.id == dto.teamId)
            if (index == -1) throw new HttpException("There is not team with this property", HttpStatus.BAD_REQUEST);

            const memberId = uuidv4()

            if (!account.teams[index].members) {
                account.teams[index].members = [];
            }

            delete dto.teamId
            account.teams[index].members.push({ id: memberId, ...dto })
            await this.db.set(id, { ...account })
            await this.orbitDb.stop()

            return { result: { id: memberId, ...dto } }

        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getMembersByTeam(id: string, teamId: string) {
        try {
            await this.db.load()

            const account = this.db.get(id)
            let index = !account.teams ? -1 : account.teams.findIndex(i => i.id == teamId)
            if (index == -1) throw new HttpException("There is not team with this property", HttpStatus.BAD_REQUEST);
            await this.orbitDb.stop()

            return { result: !account.teams[index].members ? [] : account.teams[index].members }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateMember(id: string, dto: UpdateTeamMemberDto) {
        let memberIndex: number = -1
        let teamIndex: number = -1;
        Object.keys(dto).forEach(key => dto[key] === undefined && delete dto[key])
        const updates = Object.keys(dto);
        const allowedUpdates = ["address", "name", "currency", "amount"];
        const checkedUpdates = updates.filter(items => allowedUpdates.includes(items));
        try {
            if (updates.length == 0) throw new HttpException("Please fill any form", HttpStatus.NOT_FOUND)

            await this.db.load()
            const account = this.db.get(id)
            if (!account.teams) throw new HttpException("You don't have any team", HttpStatus.BAD_REQUEST);

            account.teams.some((team, index) => {
                if (team.members) {
                    memberIndex = team.members.findIndex(i => i.id == dto.id)
                    teamIndex = index
                    if (memberIndex != -1) return true
                }
            })

            if (memberIndex == -1) throw new HttpException("There is not member with this property", HttpStatus.BAD_REQUEST);
            let newMember = account.teams[teamIndex].members[memberIndex]

            checkedUpdates.forEach(item => newMember[item] = escaper(dto[item]))

            if (dto.teamId) {
                let index = account.teams.findIndex(i => i.id == dto.teamId)
                if (index == -1) throw new HttpException("There is not any team with this property", HttpStatus.BAD_REQUEST);

                account.teams[teamIndex].members.splice(memberIndex, 1)
                account.teams[index].members.push(newMember)
            } else {
                account.teams[teamIndex].members[memberIndex] = newMember
            }

            await this.db.set(id, { ...account })
            await this.orbitDb.stop()

            return { ...newMember }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async removeMember(id: string, memberId: string) {
        let memberIndex: number = -1
        let teamIndex: number = -1;
        try {
            await this.db.load()

            const account = this.db.get(id)
            if (!account.teams) throw new HttpException("You don't have any team", HttpStatus.BAD_REQUEST);

            account.teams.some((team, index) => {
                if (team.members) {
                    memberIndex = team.members.findIndex(i => i.id == memberId)
                    teamIndex = index
                    if (memberIndex != -1) return true
                }
            })

            if (memberIndex == -1) throw new HttpException("There is not member with this property", HttpStatus.BAD_REQUEST);

            account.teams[teamIndex].members.splice(memberIndex, 1)

            await this.db.set(id, { ...account })
            await this.orbitDb.stop()
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
