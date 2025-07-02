import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityHandler } from './activity.handler';
import { Post, User } from '../../../entities';

describe('ActivityHandler', () => {
  let handler: ActivityHandler;
  let postRepository: Repository<Post>;
  let userRepository: Repository<User>;

  const mockPostRepository = {
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    bio: '',
    avatarUrl: '',
    headerUrl: '',
    isBot: false,
    isLocked: false,
    publicKey: {
      id: 'https://example.com/actors/testuser#main-key',
      publicKeyPem: 'test-public-key',
    },
    privateKey: 'test-private-key',
    posts: [],
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    actorId: 'https://example.com/actors/testuser',
    inboxUrl: 'https://example.com/actors/testuser/inbox',
    outboxUrl: 'https://example.com/actors/testuser/outbox',
    followersUrl: 'https://example.com/actors/testuser/followers',
    followingUrl: 'https://example.com/actors/testuser/following',
  } as User;

  const mockPost = {
    id: 'post-123',
    content: 'Test post content',
    contentWarning: '',
    author: mockUser as User,
    authorId: mockUser.id,
    inReplyToId: '',
    visibility: 'public' as const,
    sensitive: false,
    attachments: [],
    tags: [],
    mentions: [],
    likesCount: 0,
    sharesCount: 0,
    repliesCount: 0,
    activityId: 'activity-123',
    url: 'https://example.com/posts/post-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    postUrl: 'https://example.com/posts/post-123',
    activityUrl: 'https://example.com/activities/post-123',
  } as Post;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityHandler,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<ActivityHandler>(ActivityHandler);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('getInboxListeners', () => {
    it('should return all inbox listeners', () => {
      const listeners = handler.getInboxListeners();

      expect(listeners).toHaveProperty('Follow');
      expect(listeners).toHaveProperty('Undo');
      expect(listeners).toHaveProperty('Create');
      expect(listeners).toHaveProperty('Update');
      expect(listeners).toHaveProperty('Delete');
      expect(listeners).toHaveProperty('Like');
      expect(listeners).toHaveProperty('Announce');

      // Check that all listeners are functions
      Object.values(listeners).forEach(listener => {
        expect(typeof listener).toBe('function');
      });
    });
  });

  describe('handleOutbox', () => {
    it('should return outbox collection for existing user', async () => {
      const actorId = 'https://example.com/actors/testuser';
      const posts = [mockPost];

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPostRepository.find.mockResolvedValue(posts);

      const result = await handler.handleOutbox({}, actorId);

      expect(result).toEqual({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'OrderedCollection',
        id: `${actorId}/outbox`,
        totalItems: 1,
        orderedItems: expect.arrayContaining([
          expect.objectContaining({
            type: 'Create',
            actor: mockUser.actorId,
          }),
        ]),
      });

      expect(mockPostRepository.find).toHaveBeenCalledWith({
        where: { authorId: mockUser.id },
        order: { createdAt: 'DESC' },
        take: 20,
        relations: ['author'],
      });
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await handler.handleOutbox({}, 'https://example.com/actors/nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Activity object creation', () => {
    it('should create proper activity for public post', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPostRepository.find.mockResolvedValue([mockPost]);

      const result = await handler.handleOutbox({}, mockUser.actorId);
      const activity = result!.orderedItems[0];

      expect(activity.object).toEqual(expect.objectContaining({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Note',
        content: mockPost.content,
        attributedTo: mockUser.actorId,
        to: ['https://www.w3.org/ns/activitystreams#Public'],
        cc: [`${mockUser.actorId}/followers`],
      }));
    });

    it('should handle different visibility settings', async () => {
      const privatePost = { ...mockPost, visibility: 'followers' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPostRepository.find.mockResolvedValue([privatePost]);

      const result = await handler.handleOutbox({}, mockUser.actorId);
      const activity = result!.orderedItems[0];

      expect(activity.object.to).toEqual([]);
      expect(activity.object.cc).toEqual([]);
    });
  });

  describe('Inbox handlers', () => {
    const mockContext = {};
    const mockActivity = {
      id: 'https://remote.example/activities/123',
      type: 'Follow',
      actor: 'https://remote.example/actors/remoteuser',
      object: 'https://example.com/actors/testuser',
    };

    it('should log follow activity', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const listeners = handler.getInboxListeners();

      await listeners.Follow(mockContext, mockActivity);

      expect(consoleSpy).toHaveBeenCalledWith('Handle follow:', mockActivity);
      consoleSpy.mockRestore();
    });

    it('should log create activity', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const listeners = handler.getInboxListeners();
      const createActivity = { ...mockActivity, type: 'Create' };

      await listeners.Create(mockContext, createActivity);

      expect(consoleSpy).toHaveBeenCalledWith('Handle create:', createActivity);
      consoleSpy.mockRestore();
    });
  });
});