import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FeedbackDto } from './dto/feedback.dto';
import { EditFeedbackDto } from './dto/editFeedback.dto';
import { DataSource } from 'typeorm';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({
    summary: '전체 feedback 조회',
    description: 'feedback을 최신순으로 조회한다',
  })
  @ApiResponse({
    status: 200,
    content: {
      'application/json': {
        examples: {
          feedbacks: {
            value: [
              {
                feedbackId: '1',
                feedbackDate: '2024.04.22',
                feedbackType: 'group',
                feedbackContent:
                  '회원님! 오늘 자세는 좋았으나 마지막 스퍼트가 부족해 보였어요 호흡하실 때에도 팔 각도를 조정해 주시면...',
                feedbackTarget: {
                  '아침 6반': [1, 2],
                  '아침 5반': [5],
                },
              },
              {
                feedbackId: '2',
                feedbackDate: '2024.04.22',
                feedbackType: 'personal',
                feedbackContent:
                  '회원님! 오늘 자세는 좋았으나 마지막 스퍼트가 부족해 보였어요 호흡하실 때에도 팔 각도를 조정해 주시면...',
                feedbackTarget: { '오후 1반': [3] },
              },
            ],
          },
        },
      },
    },
  })
  @ApiBearerAuth('accessToken')
  async getAllFeedback(@Res() res: Response) {
    try {
      const user = res.locals.user;
      const userType = user.userType;

      if (userType === 'instructor') {
        const userId = user.userId;
        const feedbacks =
          await this.feedbackService.getAllFeedbackByInstructor(userId);
        return res.status(HttpStatus.OK).json(feedbacks);
      }
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  @Get(':feedbackId')
  @ApiOperation({
    summary: 'feedback 상세 조회',
    description: 'feedbackId를 통해 feedback을 상세 조회한다',
  })
  @ApiParam({
    name: 'feedbackId',
    type: 'number',
    description: '상세 조회에 필요한 feedbackId',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        feedbackId: '1',
        feedbackType: 'group',
        feedbackDate: '2024.04.22',
        feedbackTarget: {
          '아침 6반': [1, 2],
          '아침 5반': [5],
        },
        feedbackFile: 'file1',
        feedbackLink: 'URL',
        feedbackContent:
          '회원님! 오늘 자세는 좋았으나 마지막 스퍼트가 부족해 보였어요 호흡하실 때에도 팔 각도를 조정해 주시면...',
      },
    },
  })
  @ApiBearerAuth('accessToken')
  async getFeedbackDetail(
    @Res() res: Response,
    @Param('feedbackId') feedbackId: number,
  ) {
    try {
      const user = res.locals.user;
      const userType = user.userType;

      if (userType === 'instructor') {
        const feedback = await this.feedbackService.getFeedbackById(feedbackId);
        if (feedback.userId !== user.userId) {
          return res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ message: '접근 권한이 없습니다.' });
        }
        return res.status(HttpStatus.OK).json(feedback);
      }
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  @Post()
  @ApiOperation({
    summary: 'feedback을 생성 한다',
    description: '수강생을 선택하여 feedback을 남긴다',
  })
  @ApiResponse({
    status: 200,
    description: 'feedback 생성 성공',
  })
  @ApiBearerAuth('accessToken')
  async createFeedback(@Res() res: Response, @Body() feedbackDto: FeedbackDto) {
    try {
      const { userId, userType } = res.locals.user;

      if (userType !== 'instructor') {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'feedback 작성 권한이 없습니다.' });
      }
      if (feedbackDto.feedbackTarget === '') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'feedback 대상을 지정해주세요' });
      }

      const feedback = await this.feedbackService.createFeedback(
        userId,
        feedbackDto,
      );
      if (!feedback) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'feedback 생성 실패' });
      }
      if (feedback) {
        await this.feedbackService.createFeedbackTarget(
          feedback.feedbackId,
          feedbackDto.feedbackTarget,
        );
      }
      return res.status(HttpStatus.OK).json({ message: 'feedback 생성 성공' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  @Patch(':feedbackId')
  @ApiOperation({
    summary: '작성했던 feedback을 수정한다.',
    description: 'instructor가 본인이 작성한 feedback을 수정한다.',
  })
  @ApiResponse({
    status: 200,
    description: 'feedback 수정 성공',
  })
  @ApiBearerAuth('accessToken')
  async updateFeedback(
    @Res() res: Response,
    @Param('feedbackId') feedbackId: number,
    @Body() editFeedbackDto: EditFeedbackDto,
  ) {
    try {
      const { userId, userType } = res.locals.user;
      const feedback = await this.feedbackService.getFeedbackById(feedbackId);

      if (userType !== 'instructor' || feedback.userId !== userId) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'feedback 수정 권한이 없습니다.' });
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        if (feedback.feedbackTargetList !== editFeedbackDto.feedbackTarget) {
          const a = await Promise.all([
            this.feedbackService.updateFeedback(feedbackId, editFeedbackDto),
            this.feedbackService.updateFeedbackTarget(
              feedbackId,
              editFeedbackDto.feedbackTarget,
            ),
          ]);
        } else {
          await this.feedbackService.updateFeedback(
            feedbackId,
            editFeedbackDto,
          );
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new HttpException(
          'feedback 수정 실패',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } finally {
        await queryRunner.release();
      }

      return res.status(HttpStatus.OK).json({ message: 'feedback 수정 성공' });
    } catch (e) {
      console.log(e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  @Delete(':feedbackId')
  @ApiOperation({
    summary: 'feedback을 soft delete 한다.',
    description: 'feedbackId를 이용하여 해당 feedback을 soft delete한다.',
  })
  @ApiResponse({
    status: 200,
    description: 'feedback 삭제 성공',
  })
  @ApiBearerAuth('accessToken')
  async softDeleteFeedback(
    @Res() res: Response,
    @Param('feedbackId') feedbackId: number,
  ) {
    try {
      const { userId, userType } = res.locals.user;
      const feedback = await this.feedbackService.getFeedbackById(feedbackId);

      if (userType !== 'instructor' || feedback.userId !== userId) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'feedback 삭제 권한이 없습니다.' });
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await Promise.all([
          this.feedbackService.softDeleteFeedback(feedbackId),
          this.feedbackService.deleteFeedbackTarget(feedbackId),
        ]);
      } catch (error) {
        throw new HttpException(
          'feedback 삭제 실패',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } finally {
        await queryRunner.release();
      }

      return res.status(HttpStatus.OK).json({ message: 'feedback 삭제 성공' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }
}