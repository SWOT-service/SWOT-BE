import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Instructor } from './entity/instructor.entity';
import { InstructorRepository } from './instructor.repository';
import { MyLogger } from 'src/common/logger/logger.service';

@Injectable()
export class InstructorService {
  constructor(
    private readonly instructorRepository: InstructorRepository,
    private readonly logger: MyLogger,
  ) {}

  /* userType을 instructor로 지정할 경우 instructor 정보 생성 */
  async createInstructor(userId: number): Promise<Instructor> {
    try {
      return await this.instructorRepository.createInstructor(userId);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        '강사 프로필 생성 중에 오류가 발생했습니다.',
      );
    }
  }

  /* instructor의 정보 조회 */
  async findInstructorByUserId(userId: number): Promise<Instructor> {
    try {
      return await this.instructorRepository.findInstructorByUserId(userId);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        '강사 프로필 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
