import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Invitation, Actor, KeyAlgorithm, KeyPair } from '../entities';
import { randomBytes } from 'crypto';
import { ActorSyncService } from '../modules/federation/services/actor-sync.service';
import { UserService } from '../modules/user/user.service';

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npm run create-user <email> <username>');
    console.error('Example: npm run create-user alice@example.com alice');
    process.exit(1);
  }

  const [email, username] = args;
  const displayName = args[2] || username;

  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const keyPairRepository = app.get<Repository<KeyPair>>(
    getRepositoryToken(KeyPair),
  );
  const invitationRepository = app.get<Repository<Invitation>>(
    getRepositoryToken(Invitation),
  );
  const actorSyncService = app.get(ActorSyncService);
  const userService = app.get(UserService);

  try {
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      console.error('User with this email or username already exists!');
      process.exit(1);
    }

    // Create user
    const user = userRepository.create({
      username,
      email,
      displayName,
    });
    let savedUser = await userRepository.save(user);

    userService.generateKeyPairs(savedUser.id);

    savedUser = (await userRepository.findOne({
      where: {
        id: savedUser.id,
      },
      relations: ['actor'],
    })) as User;

    console.log('User created successfully!');

    // Create corresponding Actor entity
    const actor = await actorSyncService.syncUserToActor(savedUser);
    console.log('Actor entity created successfully!');

    savedUser = (await userRepository.findOne({
      where: {
        id: savedUser.id,
      },
      relations: ['actor'],
    })) as User;

    // Create invitation codes that this user can share
    const invitations: Invitation[] = [];
    for (let i = 0; i < 3; i++) {
      const invitationCode = randomBytes(16).toString('base64url');
      const invitation = invitationRepository.create({
        code: invitationCode,
        invitedBy: savedUser,
        invitedById: savedUser.id,
        maxUses: 5,
        note: `Invitation ${i + 1} from ${username}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      const saved = await invitationRepository.save(invitation);
      invitations.push(saved);
    }

    console.log('\n=== User Created Successfully ===');
    console.log(`Username: ${savedUser.username}`);
    console.log(`Email: ${savedUser.email}`);
    console.log(`Display Name: ${savedUser.displayName}`);
    console.log(`Actor ID: ${savedUser.actorId}`);
    console.log('\n=== Invitation Codes Generated ===');
    console.log('Share these invitation links with others:');
    invitations.forEach((inv, index) => {
      console.log(`\nInvitation ${index + 1}:`);
      console.log(`  Code: ${inv.code}`);
      console.log(
        `  URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/signup?invitation=${inv.code}`,
      );
      console.log(`  Max Uses: ${inv.maxUses}`);
      console.log(`  Expires: ${inv.expiresAt?.toLocaleDateString()}`);
    });
    console.log('=================================\n');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await app.close();
  }
}

// Run the script
createUser();
