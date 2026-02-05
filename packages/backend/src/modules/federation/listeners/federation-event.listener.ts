import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityPublisherService } from '../services/activity-publisher.service';
import {
  NoteCreatedEvent,
  NoteRepostedEvent,
  RepostUndoneEvent,
  FollowRequestedEvent,
  UnfollowRequestedEvent,
  FollowAcceptedEvent,
  FollowRejectedEvent,
  ProfileUpdatedEvent,
} from 'src/modules/microblogging/events/domain-events';

@Injectable()
export class FederationEventListener {
  constructor(private activityPublisher: ActivityPublisherService) {}

  @OnEvent('note.created')
  async handleNoteCreated(event: NoteCreatedEvent): Promise<void> {
    await this.activityPublisher.publishNoteCreated(event.actor, event.note);
  }

  @OnEvent('note.reposted')
  async handleNoteReposted(event: NoteRepostedEvent): Promise<void> {
    await this.activityPublisher.publishAnnounce(event.actor, event.share);
  }

  @OnEvent('repost.undone')
  async handleRepostUndone(event: RepostUndoneEvent): Promise<void> {
    await this.activityPublisher.publishUndoAnnounce(event.actor, event.share);
  }

  @OnEvent('follow.requested')
  async handleFollowRequested(event: FollowRequestedEvent): Promise<void> {
    await this.activityPublisher.publishFollow(
      event.followerActor,
      event.targetActorIri,
      event.targetInboxUrl,
    );
  }

  @OnEvent('unfollow.requested')
  async handleUnfollowRequested(event: UnfollowRequestedEvent): Promise<void> {
    await this.activityPublisher.publishUndoFollow(
      event.followerActor,
      event.targetActorIri,
      event.targetInboxUrl,
    );
  }

  @OnEvent('follow.accepted')
  async handleFollowAccepted(event: FollowAcceptedEvent): Promise<void> {
    await this.activityPublisher.publishAcceptFollow(
      event.targetActor,
      event.follow,
    );
  }

  @OnEvent('follow.rejected')
  async handleFollowRejected(event: FollowRejectedEvent): Promise<void> {
    await this.activityPublisher.publishRejectFollow(
      event.targetActor,
      event.follow,
    );
  }

  @OnEvent('profile.updated')
  async handleProfileUpdated(event: ProfileUpdatedEvent): Promise<void> {
    await this.activityPublisher.publishProfileUpdate(event.actor);
  }
}
