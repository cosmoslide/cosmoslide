import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor, KeyPair, Invitation } from '../../entities';
import { UserService } from '../user/user.service';
import { ActorSyncService } from '../federation/services/actor-sync.service';
import { AuthService } from '../auth/auth.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,

    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,

    private userService: UserService,
    private actorSyncService: ActorSyncService,
    private authService: AuthService,
  ) {}

  // Get all users with pagination and actor relation
  async getAllUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['actor'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get all actors with pagination
  async getAllActors(page: number = 1, limit: number = 20, isLocal?: boolean) {
    const queryBuilder = this.actorRepository
      .createQueryBuilder('actor')
      .leftJoinAndSelect('actor.user', 'user')
      .orderBy('actor.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (isLocal !== undefined) {
      queryBuilder.where('actor.isLocal = :isLocal', { isLocal });
    }

    const [actors, total] = await queryBuilder.getManyAndCount();

    return {
      data: actors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Create a new user (same as create-user script)
  async createUser(email: string, username: string, displayName?: string) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      displayName: displayName || username,
    });
    let savedUser = await this.userRepository.save(user);

    // Generate key pairs
    await this.userService.generateKeyPairs(savedUser.id);

    // Create corresponding Actor entity
    const actor = await this.actorSyncService.syncUserToActor(savedUser);

    // Reload user with actor relation
    savedUser = (await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['actor'],
    })) as User;

    // Create invitation codes
    const invitations: Invitation[] = [];
    for (let i = 0; i < 3; i++) {
      const invitationCode = randomBytes(16).toString('base64url');
      const invitation = this.invitationRepository.create({
        code: invitationCode,
        invitedBy: savedUser,
        invitedById: savedUser.id,
        maxUses: 5,
        note: `Invitation ${i + 1} from ${username}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      const saved = await this.invitationRepository.save(invitation);
      invitations.push(saved);
    }

    return {
      user: savedUser,
      actor,
      invitations: invitations.map((inv) => ({
        code: inv.code,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/signup?invitation=${inv.code}`,
        maxUses: inv.maxUses,
        expiresAt: inv.expiresAt,
      })),
    };
  }

  // Toggle admin status
  async toggleAdminStatus(userId: string, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isAdmin = isAdmin;
    await this.userRepository.save(user);

    return user;
  }

  // Grant admin role to user by email
  async grantAdminByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    user.isAdmin = true;
    await this.userRepository.save(user);

    return user;
  }

  // Request admin magic link
  async requestAdminMagicLink(email: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has admin privileges
    if (!user.isAdmin) {
      throw new UnauthorizedException('Admin privileges required');
    }

    // Use AuthService to generate magic link with admin URL
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3004';
    await this.authService.requestMagicLink(email, undefined, `${adminUrl}/login`);
  }

  // Sync a single actor's ActivityPub information
  async syncActor(actorId: string): Promise<Actor> {
    const actor = await this.actorRepository.findOne({
      where: { id: actorId, isLocal: true },
      relations: ['user'],
    });

    if (!actor) {
      throw new NotFoundException('Local actor not found');
    }

    if (!actor.user) {
      throw new Error(`Actor ${actorId} has no associated user`);
    }

    // Reload user with actor relation to ensure all getters work properly
    const user = await this.userRepository.findOne({
      where: { id: actor.user.id },
      relations: ['actor'],
    });

    if (!user) {
      throw new Error(`User ${actor.user.id} not found`);
    }

    return await this.actorSyncService.syncUserToActor(user);
  }

  // Sync all local actors' ActivityPub information
  async syncAllLocalActors(): Promise<{ synced: number; errors: string[] }> {
    const localActors = await this.actorRepository.find({
      where: { isLocal: true },
      relations: ['user'],
    });

    let syncedCount = 0;
    const errors: string[] = [];

    for (const actor of localActors) {
      try {
        await this.syncActor(actor.id);
        syncedCount++;
      } catch (error) {
        errors.push(
          `Failed to sync actor ${actor.id} (${actor.preferredUsername}): ${error.message}`,
        );
      }
    }

    return {
      synced: syncedCount,
      errors,
    };
  }
}
