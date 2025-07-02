import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InvitationService } from './invitation.service';
import { MailService } from '../mail/mail.service';
import { User, MagicLink } from '../../entities';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let magicLinkRepository: Repository<MagicLink>;
  let jwtService: JwtService;
  let invitationService: InvitationService;
  let mailService: MailService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMagicLinkRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockInvitationService = {
    validateInvitation: jest.fn(),
    useInvitation: jest.fn(),
  };

  const mockMailService = {
    sendMagicLink: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(MagicLink),
          useValue: mockMagicLinkRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InvitationService,
          useValue: mockInvitationService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    magicLinkRepository = module.get<Repository<MagicLink>>(getRepositoryToken(MagicLink));
    jwtService = module.get<JwtService>(JwtService);
    invitationService = module.get<InvitationService>(InvitationService);
    mailService = module.get<MailService>(MailService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('requestMagicLink', () => {
    it('should send magic link for existing user', async () => {
      const email = 'test@example.com';
      const existingUser = { id: '123', email };
      
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockMagicLinkRepository.create.mockReturnValue({ token: 'test-token' });
      mockMagicLinkRepository.save.mockResolvedValue({ token: 'test-token' });

      await service.requestMagicLink(email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(mockMagicLinkRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          userId: existingUser.id,
        })
      );
      expect(mockMailService.sendMagicLink).toHaveBeenCalled();
    });

    it('should validate invitation code if provided', async () => {
      const email = 'test@example.com';
      const invitationCode = 'valid-code';
      
      mockUserRepository.findOne.mockResolvedValue(null);
      mockInvitationService.validateInvitation.mockResolvedValue({ code: invitationCode });
      mockMagicLinkRepository.create.mockReturnValue({ token: 'test-token' });
      mockMagicLinkRepository.save.mockResolvedValue({ token: 'test-token' });

      await service.requestMagicLink(email, invitationCode);

      expect(mockInvitationService.validateInvitation).toHaveBeenCalledWith(invitationCode);
    });
  });

  describe('verifyMagicLink', () => {
    it('should sign in existing user with valid magic link', async () => {
      const token = 'valid-token';
      const existingUser = { 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser' 
      };
      const magicLink = {
        token,
        user: existingUser,
        isValid: true,
        used: false,
      };

      mockMagicLinkRepository.findOne.mockResolvedValue(magicLink);
      mockMagicLinkRepository.save.mockResolvedValue({ ...magicLink, used: true });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyMagicLink(token);

      expect(result).toEqual({
        user: existingUser,
        token: 'jwt-token',
      });
      expect(mockMagicLinkRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true })
      );
    });

    it('should create new user with valid magic link and username', async () => {
      const token = 'valid-token';
      const username = 'newuser';
      const email = 'new@example.com';
      const magicLink = {
        token,
        email,
        user: null,
        isValid: true,
        used: false,
        invitationCode: 'valid-invitation',
      };

      mockMagicLinkRepository.findOne.mockResolvedValue(magicLink);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockInvitationService.validateInvitation.mockResolvedValue({ code: 'valid-invitation' });
      mockUserRepository.create.mockReturnValue({ id: 'new-user-id', username, email });
      mockUserRepository.save.mockResolvedValue({ id: 'new-user-id', username, email });
      mockMagicLinkRepository.save.mockResolvedValue({ ...magicLink, used: true });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyMagicLink(token, username);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username,
          email,
        })
      );
      expect(mockInvitationService.useInvitation).toHaveBeenCalled();
    });

    it('should throw error for invalid magic link', async () => {
      const token = 'invalid-token';
      mockMagicLinkRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyMagicLink(token)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for new user without username', async () => {
      const token = 'valid-token';
      const magicLink = {
        token,
        user: null,
        isValid: true,
      };

      mockMagicLinkRepository.findOne.mockResolvedValue(magicLink);

      await expect(service.verifyMagicLink(token)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserById', () => {
    it('should return user by id', async () => {
      const userId = '123';
      const user = { id: userId, email: 'test@example.com' };
      
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserById(userId);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById('non-existent');

      expect(result).toBeNull();
    });
  });
});