import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Actor, KeyPair, KeyAlgorithm, Follow } from '../../../entities';
import { ActorSyncService } from '../services/actor-sync.service';
import {
  Application,
  exportJwk,
  Federation,
  Follow as APFollow,
  generateCryptoKeyPair,
  Image,
  importJwk,
  importPkcs1,
  importSpki,
  Person,
  RequestContext,
  getActorHandle,
  Accept,
  Endpoints,
  Undo,
  Reject,
} from '@fedify/fedify';
import { FollowService } from '../../microblogging/services/follow.service';

@Injectable()
export class ActorHandler {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Actor)
    private actorRepository: Repository<Actor>,
    @InjectRepository(KeyPair)
    private keyPairRepository: Repository<KeyPair>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    private actorSyncService: ActorSyncService,
    private followService: FollowService,
  ) {}

  async setup(federation: Federation<unknown>) {
    federation
      .setActorDispatcher(
        '/ap/actors/{identifier}',
        this.handleActor.bind(this),
      )
      .mapHandle(async (ctx, username) => {
        const user = await this.userRepository.findOne({
          where: { username },
        });
        if (!user) {
          console.log('User not found for handle:', username);
          return null;
        }
        const actor = await this.actorSyncService.syncUserToActor(user);
        return actor.id;
      })
      .mapAlias((ctx, resource: URL) => {
        if (resource.protocol !== 'https:') return null;
        const m = /^\/@(\w+)$/.exec(resource.pathname);
        if (m == null) return null;

        console.log({ m });

        return { username: m[1] };
      })
      .setKeyPairsDispatcher(this.handleKeyPairs.bind(this));

    federation
      .setInboxListeners('/ap/actors/{identifier}/inbox', '/inbox')
      .on(APFollow, async (ctx, follow) => {
        console.log({ follow });
        if (follow.objectId === null) {
          return;
        }

        const object = ctx.parseUri(follow.objectId);
        if (object === null || object.type !== 'actor') {
          return;
        }

        const follower = await follow.getActor();
        if (follower?.id === null || follower?.inboxId == null) {
          return;
        }

        const targetActor = await this.actorRepository.findOne({
          where: {
            preferredUsername: object.identifier,
          },
        });

        let followerActor = await this.actorRepository.findOne({
          where: {
            url: follower.url?.href?.toString(),
          },
        });

        if (followerActor) {
          followerActor = this.actorRepository.create({
            actorId: follower.id.href?.toString(),
            preferredUsername: await getActorHandle(follower),
            name: follower.name?.toString(),
            inboxUrl: follower.inboxId.href?.toString(),
            sharedInboxUrl: follower.endpoints?.sharedInbox?.href?.toString(),
            url: follower.url?.href?.toString(),
          });
        }

        const followerId = followerActor?.id;

        this.followService.followActor(followerActor!, targetActor!);

        const accept = new Accept({
          actor: follow.objectId,
          to: follow.actorId,
          object: follow,
        });

        ctx.sendActivity(object, follower, accept);
      })
      .on(Undo, async (ctx, undo) => {
        console.log({ undo });
        const object = await undo.getObject();
        if (object instanceof APFollow) handleUndoFollow(ctx, undo);
      })
      .on(Accept, async (ctx, accept) => {
        console.log({ accept });
        const object = await accept.getObject();
        if (object instanceof APFollow) handleAcceptFollow(ctx, accept);
      })
      .on(Reject, async (ctx, reject) => {
        console.log({ reject });
        const object = await reject.getObject();
        if (object instanceof APFollow) handleRejectFollow(ctx, reject);
      });

    const handleRejectFollow = async (ctx, reject: Reject) => {
      const object = (await reject.getObject()) as APFollow;
      if (reject.actorId === null || object.objectId === null) return;

      const parsed = ctx.parseUri(object.objectId);
      if (parsed === null || parsed.type !== 'actor') return;

      const targetActor = await this.actorRepository.findOne({
        where: {
          preferredUsername: parsed.identifier,
        },
      });

      // [TODO] How about requested actor is from remote instance
      const requestedActor = await this.actorRepository.findOne({
        where: {
          url: reject.actorId.href,
        },
      });

      this.followService.rejectFollowRequest(requestedActor!, targetActor!);
    };

    const handleAcceptFollow = async (ctx, accept: Accept) => {
      const object = (await accept.getObject()) as APFollow;
      if (accept.actorId === null || object.objectId === null) return;

      const parsed = ctx.parseUri(object.objectId);
      if (parsed === null || parsed.type !== 'actor') return;

      const targetActor = await this.actorRepository.findOne({
        where: {
          preferredUsername: parsed.identifier,
        },
        relations: ['user'],
      });

      // [TODO] How about requested actor is from remote instance
      const requestedActor = await this.actorRepository.findOne({
        where: {
          url: accept.toId?.href,
        },
        relations: ['user'],
      });

      this.followService.acceptFollowRequest(requestedActor!, targetActor!);
    };

    const handleUndoFollow = async (ctx, undo: Undo) => {
      const object = (await undo.getObject()) as APFollow;
      if (undo.actorId === null || object.objectId === null) return;
      const parsed = ctx.parseUri(object.objectId);
      if (parsed === null || parsed.type !== 'actor') return;

      const followedActor = await this.actorRepository.findOne({
        where: {
          preferredUsername: parsed.identifier,
        },
      });
      const followerActor = await this.actorRepository.findOne({
        where: {
          url: undo.actorId.href,
        },
      });

      await this.followRepository.delete({
        follower: followerActor!,
        following: followedActor!,
      });
    };

    federation
      .setFollowersDispatcher(
        '/ap/actors/{identifier}/followers',
        async (ctx, identifier, cursor) => {
          const {
            items: followers,
            nextCursor,
            last,
          } = await this.followService.getFollowers(identifier, {
            cursor,
            limit: 10,
          });
          const items = followers.map((follower) => ({
            id: new URL(follower.url),
            inboxId: new URL(follower.inboxUrl),
          }));

          return {
            items,
            nextCursor: last ? null : nextCursor?.toString(),
          };
        },
      )
      .setFirstCursor(async (ctx, identifier) => '');

    federation
      .setFollowingDispatcher(
        '/ap/actors/{identifier}/following',
        async (ctx, identifier, cursor) => {
          const {
            items: followings,
            nextCursor,
            last,
          } = await this.followService.getFollowings(identifier, {
            cursor,
            limit: 10,
          });
          const items = followings.map((following) => new URL(following.url));

          return {
            items,
            nextCursor: last ? null : nextCursor?.toString(),
          };
        },
      )
      .setFirstCursor(async (ctx, identifier) => '');
  }

  async handleKeyPairs(ctx: RequestContext<unknown>, identifier: string) {
    const actor = await this.actorRepository.findOne({
      where: { id: identifier },
      relations: ['user'],
    });

    if (!actor) {
      console.log('Actor not found for identifier:', identifier);
      return [];
    }

    // Load all active key pairs for the user
    const user = actor.user;
    const keyPairs = await this.keyPairRepository.find({
      where: {
        userId: user.id,
        isActive: true,
      },
      order: {
        algorithm: 'ASC', // RSA first, then Ed25519
        createdAt: 'ASC',
      },
    });

    const availableAlgorithms = keyPairs.map((keyPair) => keyPair.algorithm);
    let result: CryptoKeyPair[] = [];
    for (const algorithm of [KeyAlgorithm.RSA, KeyAlgorithm.Ed25519] as const) {
      if (!availableAlgorithms.includes(algorithm)) {
        const { privateKey, publicKey } =
          await generateCryptoKeyPair(algorithm);

        let keyPair = this.keyPairRepository.create({
          algorithm,
          privateKey: JSON.stringify(await exportJwk(privateKey)),
          publicKey: JSON.stringify(await exportJwk(publicKey)),
          user,
          userId: user.id,
        });

        result.push({
          privateKey: await importJwk(
            JSON.parse(keyPair.privateKey),
            'private',
          ),
          publicKey: await importJwk(JSON.parse(keyPair.publicKey), 'public'),
        });

        await this.keyPairRepository.save(keyPair);
      } else {
        let keyPair = keyPairs.find((item) => item.algorithm === algorithm);

        result.push({
          privateKey: await importJwk(
            JSON.parse(keyPair!.privateKey),
            'private',
          ),
          publicKey: await importJwk(JSON.parse(keyPair!.publicKey), 'public'),
        });
      }
    }

    return result;
  }

  async getPrimaryKeyPair(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Get the first active RSA key pair
    const keyPair = await this.keyPairRepository.findOne({
      where: {
        userId: user.id,
        algorithm: KeyAlgorithm.RSA,
        isActive: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return keyPair;
  }

  async handleActor(ctx: RequestContext<unknown>, identifier: string) {
    const actor = await this.actorRepository.findOne({
      where: {
        id: identifier,
      },
    });
    if (!actor) return null;

    // Create Fedify actor data using context methods for proper URI generation
    const actorData: any = {
      id: ctx.getActorUri(identifier),
      preferredUsername: actor.preferredUsername,
      name: actor.name,
      summary: actor.summary,
      url: ctx.getActorUri(identifier),
      // inbox: ctx.getInboxUri(handle),
      // outbox: ctx.getOutboxUri(handle),
      followers: ctx.getFollowersUri(identifier),
      following: ctx.getFollowingUri(identifier),
      manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
    };

    // Add optional icon if available
    if (actor.icon) {
      actorData.icon = new Image({
        url: new URL(actor.icon.url),
        mediaType: actor.icon.mediaType,
      });
    }

    // Return the appropriate Fedify Actor type
    let result;
    if (actor.type === 'Person') {
      const keys = await ctx.getActorKeyPairs(identifier);
      result = new Person({
        ...actorData,
        publicKey: keys[0].cryptographicKey,
        assertionMethods: keys.map((key) => key.multikey),
        inbox: ctx.getInboxUri(identifier),
        endpoints: new Endpoints({
          sharedInbox: ctx.getInboxUri(),
        }),
        url: ctx.getActorUri(identifier),
      });
    } else if (actor.type === 'Application' || actor.type === 'Service') {
      result = new Application(actorData);
    } else {
      // Default to Person if type is unknown
      result = new Person(actorData);
    }

    return result;
  }
}
