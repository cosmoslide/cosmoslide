import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { Invitation, User } from '../../entities';

describe('InvitationService', () => {
  let service: InvitationService;
  let invitationRepository: Repository<Invitation>;

  const mockInvitationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: mockInvitationRepository,
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    invitationRepository = module.get<Repository<Invitation>>(
      getRepositoryToken(Invitation),
    );

    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create a new invitation', async () => {
      const invitationData = {
        email: 'invitee@example.com',
        maxUses: 5,
        note: 'Test invitation',
      };

      const createdInvitation = {
        id: 'inv-123',
        code: 'test-code',
        ...invitationData,
        invitedBy: mockUser,
        invitedById: mockUser.id,
        usedCount: 0,
        createdAt: new Date(),
      };

      mockInvitationRepository.create.mockReturnValue(createdInvitation);
      mockInvitationRepository.save.mockResolvedValue(createdInvitation);

      const result = await service.createInvitation(mockUser, invitationData);

      expect(result).toEqual(createdInvitation);
      expect(mockInvitationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invitedBy: mockUser,
          invitedById: mockUser.id,
          ...invitationData,
        }),
      );
    });
  });

  describe('validateInvitation', () => {
    it('should return valid invitation', async () => {
      const code = 'valid-code';
      const invitation = {
        id: 'inv-123',
        code,
        usedCount: 0,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        isValid: true,
      };

      mockInvitationRepository.findOne.mockResolvedValue(invitation);

      const result = await service.validateInvitation(code);

      expect(result).toEqual(invitation);
      expect(mockInvitationRepository.findOne).toHaveBeenCalledWith({
        where: { code },
        relations: ['invitedBy'],
      });
    });

    it('should throw error for non-existent invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(service.validateInvitation('invalid-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for expired invitation', async () => {
      const invitation = {
        code: 'expired-code',
        usedCount: 0,
        maxUses: 1,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        isValid: false,
      };

      mockInvitationRepository.findOne.mockResolvedValue(invitation);

      await expect(service.validateInvitation('expired-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for fully used invitation', async () => {
      const invitation = {
        code: 'used-code',
        usedCount: 5,
        maxUses: 5,
        expiresAt: new Date(Date.now() + 3600000),
        isValid: false,
      };

      mockInvitationRepository.findOne.mockResolvedValue(invitation);

      await expect(service.validateInvitation('used-code')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('useInvitation', () => {
    it('should increment used count', async () => {
      const invitation = {
        id: 'inv-123',
        code: 'test-code',
        usedCount: 0,
      };

      mockInvitationRepository.save.mockResolvedValue({
        ...invitation,
        usedCount: 1,
      });

      await service.useInvitation(invitation as any);

      expect(mockInvitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedCount: 1,
        }),
      );
    });
  });

  describe('getInvitationByCode', () => {
    it('should return invitation by code', async () => {
      const code = 'test-code';
      const invitation = { id: 'inv-123', code };

      mockInvitationRepository.findOne.mockResolvedValue(invitation);

      const result = await service.getInvitationByCode(code);

      expect(result).toEqual(invitation);
    });

    it('should return null for non-existent code', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      const result = await service.getInvitationByCode('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserInvitations', () => {
    it('should return user invitations sorted by date', async () => {
      const userId = 'user-123';
      const invitations = [
        { id: 'inv-1', invitedById: userId, createdAt: new Date('2024-01-02') },
        { id: 'inv-2', invitedById: userId, createdAt: new Date('2024-01-01') },
      ];

      mockInvitationRepository.find.mockResolvedValue(invitations);

      const result = await service.getUserInvitations(userId);

      expect(result).toEqual(invitations);
      expect(mockInvitationRepository.find).toHaveBeenCalledWith({
        where: { invitedById: userId },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
