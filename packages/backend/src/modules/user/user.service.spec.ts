import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    headerUrl: 'https://example.com/header.jpg',
    isBot: false,
    isLocked: false,
    publicKey: {
      id: 'https://example.com/actors/testuser#main-key',
      publicKeyPem: 'test-public-key',
    },
    privateKey: 'test-private-key',
    posts: [],
    followersCount: 10,
    followingCount: 5,
    postsCount: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
    actorId: 'https://example.com/actors/testuser',
    inboxUrl: 'https://example.com/actors/testuser/inbox',
    outboxUrl: 'https://example.com/actors/testuser/outbox',
    followersUrl: 'https://example.com/actors/testuser/followers',
    followingUrl: 'https://example.com/actors/testuser/following',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        headerUrl: 'https://example.com/new-header.jpg',
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
    });

    it('should handle partial updates', async () => {
      const updateData = {
        displayName: 'Only Name Updated',
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateData);

      expect(result.displayName).toBe('Only Name Updated');
      expect(result.bio).toBe(mockUser.bio); // Should remain unchanged
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserStats('user-123');

      expect(result).toEqual({
        postsCount: 20,
        followersCount: 10,
        followingCount: 5,
      });
    });
  });

  describe('getPublicProfile', () => {
    it('should return public profile information', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getPublicProfile('testuser');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        displayName: mockUser.displayName,
        bio: mockUser.bio,
        avatarUrl: mockUser.avatarUrl,
        headerUrl: mockUser.headerUrl,
        isBot: mockUser.isBot,
        isLocked: mockUser.isLocked,
        postsCount: mockUser.postsCount,
        followersCount: mockUser.followersCount,
        followingCount: mockUser.followingCount,
        createdAt: mockUser.createdAt,
        actorId: mockUser.actorId,
        inboxUrl: mockUser.inboxUrl,
        outboxUrl: mockUser.outboxUrl,
        followersUrl: mockUser.followersUrl,
        followingUrl: mockUser.followingUrl,
      });
    });

    it('should not include private information in public profile', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getPublicProfile('testuser');

      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('privateKey');
      expect(result).not.toHaveProperty('publicKey');
    });
  });
});