import { Actor, Follow, Note } from 'src/entities';

export class NoteCreatedEvent {
  constructor(
    public readonly actor: Actor,
    public readonly note: Note,
  ) {}
}

export class NoteRepostedEvent {
  constructor(
    public readonly actor: Actor,
    public readonly share: Note,
  ) {}
}

export class RepostUndoneEvent {
  constructor(
    public readonly actor: Actor,
    public readonly share: Note,
  ) {}
}

export class FollowRequestedEvent {
  constructor(
    public readonly followerActor: Actor,
    public readonly targetActorIri: string,
    public readonly targetInboxUrl?: string,
  ) {}
}

export class UnfollowRequestedEvent {
  constructor(
    public readonly followerActor: Actor,
    public readonly targetActorIri: string,
    public readonly targetInboxUrl?: string,
  ) {}
}

export class FollowAcceptedEvent {
  constructor(
    public readonly targetActor: Actor,
    public readonly requestedActor: Actor,
    public readonly follow: Follow,
  ) {}
}

export class FollowRejectedEvent {
  constructor(
    public readonly targetActor: Actor,
    public readonly requestedActor: Actor,
    public readonly follow: Follow,
  ) {}
}

export class ProfileUpdatedEvent {
  constructor(public readonly actor: Actor) {}
}
