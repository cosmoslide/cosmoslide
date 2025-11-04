import {
  Note as APNote,
  Announce as APAnnounce,
  Context,
  Create,
  Document,
  Image,
  Person,
  PUBLIC_COLLECTION,
  Update,
} from '@fedify/fedify';
import { Temporal } from '@js-temporal/polyfill';
import { Actor, Note, PostVisibility } from 'src/entities';

export const toAPPersonObject = (
  ctx: Context<unknown>,
  actor: Actor,
): Partial<Person & { icon?: Image; followers?: URL; following?: URL }> => {
  const identifier = actor.id;

  // Include icon if available
  const icon = actor.icon
    ? new Image({
        url: new URL(actor.icon.url),
        mediaType: actor.icon.mediaType,
      })
    : undefined;

  return {
    id: ctx.getActorUri(identifier),
    name: actor.name,
    preferredUsername: actor.preferredUsername,
    url: new URL(`/@${actor.preferredUsername}`, ctx.canonicalOrigin),
    summary: actor.summary,
    followers: ctx.getFollowersUri(identifier),
    following: ctx.getFollowingUri(identifier),
    manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
    icon,
  };
};

export const toAPNote = (ctx: Context<unknown>, note: Note) => {
  const author = note.author;
  const published = Temporal.Instant.from(note.publishedAt.toISOString());
  
  // Convert attachments to ActivityPub format using Fedify classes
  const attachments = note.attachments?.map((attachment) => {
    const url = new URL(attachment.url);
    if (attachment.type === 'Image') {
      return new Image({
        url,
        mediaType: attachment.mediaType,
        name: attachment.name,
      });
    } else if (attachment.type === 'Document') {
      return new Document({
        url,
        mediaType: attachment.mediaType,
        name: attachment.name,
      });
    }
    return url; // Fallback to just URL
  }) || [];

  return new APNote({
    id: ctx.getObjectUri(APNote, { noteId: note.id }),
    attribution: ctx.getActorUri(note.authorId),
    url: new URL(
      `/@${author.preferredUsername}/${note.id}`,
      ctx.canonicalOrigin,
    ),
    published,
    content: note.content,
    attachments: attachments.length > 0 ? attachments : undefined,
    ...getNoteVisibility(ctx, note),
  });
};

export const toTemporalInstance = (
  datetime: string | Temporal.Instant | null,
) => {
  if (datetime == null) return undefined;
  return Temporal.Instant.from(datetime);
};

export const convertTemporalToDate = (datetime?: Temporal.Instant) => {
  if (datetime == null) return new Date();
  return new Date(datetime.epochMilliseconds);
};

export const toAPAnnounce = (ctx: Context<unknown>, share: Note) => {
  const sharedActor = share.author;
  const published = toTemporalInstance(share.publishedAt.toISOString());

  return new APAnnounce({
    id: ctx.getObjectUri(APAnnounce, { id: share.id }),
    actor: ctx.getActorUri(sharedActor.id),
    ...getSharedNoteVisibility(ctx, share),
    object: new URL(share.sharedNote.iri),
    published,
  });
};

const getNoteVisibility = (ctx: Context<unknown>, note: Note) => {
  const authorId = new URL(note.author.actorId);
  switch (note.visibility) {
    case 'public':
      return {
        tos: [authorId, PUBLIC_COLLECTION],
        ccs: [PUBLIC_COLLECTION],
      };
    case 'unlisted':
      return {
        tos: [authorId, ctx.getFollowersUri(note.author.id)],
        ccs: [PUBLIC_COLLECTION],
      };
    case 'followers':
      return {
        tos: [authorId, ctx.getFollowersUri(note.author.id)],
        ccs: [ctx.getFollowersUri(note.author.id)],
      };
    case 'direct':
      return {};
  }
};

const getSharedNoteVisibility = (ctx: Context<unknown>, share: Note) => {
  const author = share.author;
  const authorId = author.id;
  const user = author.user;
  const defaultVisibility = user.defaultVisibility;
  const authorUrl = ctx.getActorUri(authorId);

  switch (defaultVisibility) {
    case PostVisibility.PUBLIC:
      return {
        tos: [authorUrl, PUBLIC_COLLECTION],
        ccs: [PUBLIC_COLLECTION],
      };
    case 'unlisted':
      return {
        tos: [authorUrl, ctx.getFollowersUri(authorId)],
        ccs: [PUBLIC_COLLECTION],
      };
    case 'followers':
      return {
        tos: [authorUrl, ctx.getFollowersUri(authorId)],
        ccs: [ctx.getFollowersUri(authorId)],
      };
    case 'direct':
      return {};
  }
};

export const toUpdatePersonActivity = async (
  ctx: Context<unknown>,
  actor: Actor,
) => {
  const actorUri = ctx.getActorUri(actor.id);
  return new Update({
    id: new URL('#update-' + Date.now(), ctx.getActorUri(actor.id)),
    actor: actorUri,
    tos: [PUBLIC_COLLECTION],
    ccs: [PUBLIC_COLLECTION],
    object: actorUri,
  });
};
