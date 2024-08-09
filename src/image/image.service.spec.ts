import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { ImageRepository } from './image.repository';
import { QueryRunner } from 'typeorm';
import { Image } from './entity/image.entity';

export class MockImageRepository {
  readonly mockImage: Image = {
    imageId: 1,
    feedbackId: 1,
    imagePath: 'imageURL',
    imageCreatedAt: new Date(),
    imageUpdatedAt: new Date(),
  };
  createImage = jest.fn();
  getImagesByFeedbackId = jest.fn();
  deleteImage = jest.fn();
  deleteImagesByFeedbackId = jest.fn();
}

describe('ImageService', () => {
  let service: ImageService;
  let repository: ImageRepository;

  const mockImage = new MockImageRepository().mockImage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        { provide: ImageRepository, useClass: MockImageRepository },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
    repository = module.get<ImageRepository>(ImageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createImage', () => {
    it('feedback에 넣을 image를 저장', async () => {
      const feedbackId = 1;
      const fileUrl = 'test_image_url';

      await service.createImage(feedbackId, fileUrl);

      expect(repository.createImage).toHaveBeenCalledWith(feedbackId, fileUrl);
    });
  });

  describe('getImagesByFeedbackId', () => {
    it('feedbackId에 해당하는 image를 return', async () => {
      const feedbackId = 1;

      (repository.getImagesByFeedbackId as jest.Mock).mockResolvedValue([
        mockImage,
      ]);

      const result = await service.getImagesByFeedbackId(feedbackId);

      expect(repository.getImagesByFeedbackId).toHaveBeenCalledWith(feedbackId);
      expect(result).toEqual([mockImage]);
    });
  });

  describe('deleteImagesByFeedbackId', () => {
    it('feedbackId에 해당하는 image 삭제', async () => {
      const feedbackId = 1;

      await service.deleteImagesByFeedbackId(feedbackId);

      expect(repository.deleteImagesByFeedbackId).toHaveBeenCalledWith(
        feedbackId,
      );
    });
  });

  describe('deleteImage', () => {
    it('image 삭제', async () => {
      const imageId = 1;

      await service.deleteImage(imageId);

      expect(repository.deleteImage).toHaveBeenCalledWith(imageId);
    });
  });
});
