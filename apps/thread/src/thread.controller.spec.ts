import { Test, TestingModule } from '@nestjs/testing';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';

describe('ThreadController', () => {
  let threadController: ThreadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ThreadController],
      providers: [ThreadService],
    }).compile();

    threadController = app.get<ThreadController>(ThreadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(threadController.getHello()).toBe('Hello World!');
    });
  });
});
