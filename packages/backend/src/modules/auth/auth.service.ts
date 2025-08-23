import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, MagicLink } from '../../entities';
import { InvitationService } from './invitation.service';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { ActorSyncService } from '../federation/services/actor-sync.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MagicLink)
    private magicLinkRepository: Repository<MagicLink>,
    private jwtService: JwtService,
    private invitationService: InvitationService,
    private mailService: MailService,
    private actorSyncService: ActorSyncService,
    private userService: UserService,
  ) { }

  async requestMagicLink(
    email: string,
    invitationCode?: string,
  ): Promise<void> {
    // If invitation code is provided, validate it
    if (invitationCode) {
      await this.invitationService.validateInvitation(invitationCode);
    }

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    // Generate magic link token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Create magic link
    const magicLink = this.magicLinkRepository.create({
      token,
      email,
      userId: existingUser?.id,
      invitationCode,
      expiresAt,
    });

    await this.magicLinkRepository.save(magicLink);

    // Send email with magic link
    const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    await this.mailService.sendMagicLink(email, magicLinkUrl);
  }

  async verifyMagicLink(
    token: string,
    username?: string,
    displayName?: string,
  ): Promise<{ user: User; token: string }> {
    const magicLink = await this.magicLinkRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!magicLink || !magicLink.isValid) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    let user: User;

    if (magicLink.user) {
      // Existing user signin
      user = magicLink.user;
    } else {
      // New user signup
      if (!username) {
        throw new BadRequestException('Username is required for new users');
      }

      // Check if username already exists
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }

      // If invitation code was used, validate and use it
      if (magicLink.invitationCode) {
        const invitation = await this.invitationService.validateInvitation(
          magicLink.invitationCode,
        );
        await this.invitationService.useInvitation(invitation);
      }

      // Create user
      user = this.userRepository.create({
        username,
        email: magicLink.email,
        displayName: displayName || username,
      });

      user = await this.userRepository.save(user);

      await this.userService.generateKeyPairs(user.id);

      // Create corresponding Actor entity for new user
      await this.actorSyncService.syncUserToActor(user);
    }

    // Mark magic link as used
    magicLink.used = true;
    await this.magicLinkRepository.save(magicLink);

    // Generate JWT token
    const jwtToken = this.generateToken(user);

    return { user, token: jwtToken };
  }

  async cleanupExpiredMagicLinks(): Promise<void> {
    await this.magicLinkRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    return this.jwtService.sign(payload);
  }
}
