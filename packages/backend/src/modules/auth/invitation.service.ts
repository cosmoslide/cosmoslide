import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, User } from '../../entities';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {}

  async createInvitation(
    invitedBy: User,
    data: {
      email?: string;
      maxUses?: number;
      expiresAt?: Date;
      note?: string;
    },
  ): Promise<Invitation> {
    const code = this.generateInvitationCode();

    const invitation = this.invitationRepository.create({
      code,
      invitedBy,
      invitedById: invitedBy.id,
      ...data,
    });

    return await this.invitationRepository.save(invitation);
  }

  async validateInvitation(code: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { code },
      relations: ['invitedBy'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation code');
    }

    if (!invitation.isValid) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    return invitation;
  }

  async useInvitation(invitation: Invitation): Promise<void> {
    invitation.usedCount += 1;
    await this.invitationRepository.save(invitation);
  }

  private generateInvitationCode(): string {
    return randomBytes(16).toString('base64url');
  }

  async getInvitationByCode(code: string): Promise<Invitation | null> {
    return await this.invitationRepository.findOne({
      where: { code },
      relations: ['invitedBy'],
    });
  }

  async getUserInvitations(userId: string): Promise<Invitation[]> {
    return await this.invitationRepository.find({
      where: { invitedById: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
