import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Users } from './entity/users.entity';
import { UsersDto } from './dto/users.dto';
import { UserTypeDto } from './dto/userType.dto';
import { UpdateResult } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findUserByEmail(
    email: string,
    provider: string,
  ): Promise<Users | undefined> {
    return await this.usersRepository.findUserByEmail(email, provider);
  }

  async createUser(userData: UsersDto): Promise<Users> {
    return await this.usersRepository.createUser(userData);
  }

  async findUserByPk(userId: number): Promise<Users> {
    return await this.usersRepository.findUserByPk(userId);
  }

  async selectUserType(
    userId: number,
    userTypeDto: UserTypeDto,
  ): Promise<UpdateResult> {
    return await this.usersRepository.selectUserType(userId, userTypeDto);
  }
}
