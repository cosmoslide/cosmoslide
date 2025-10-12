import {
  Note as APNote,
  Context,
  Create,
  Image,
  Person,
  PUBLIC_COLLECTION,
} from '@fedify/fedify';
import { Temporal } from '@js-temporal/polyfill';
import { Actor, Note } from 'src/entities';

export const toAPPersonObject = (
  ctx: Context<unknown>,
  actor: Actor,
): Partial<Person & { icon?: Image; followers?: URL; following?: URL }> => {
  const identifier = actor.id;
  return {
    id: ctx.getActorUri(identifier),
    name: actor.name,
    preferredUsername: actor.preferredUsername,
    url: new URL(`/@${actor.preferredUsername}`, ctx.canonicalOrigin),
    summary: actor.summary,
    followers: ctx.getFollowersUri(identifier),
    following: ctx.getFollowingUri(identifier),
    manuallyApprovesFollowers: actor.manuallyApprovesFollowers,
  };
};

export const toAPNote = (ctx: Context<unknown>, note: Note) => {
  const author = note.author;
  const published = Temporal.Instant.from(note.publishedAt.toISOString());
  return new APNote({
    id: ctx.getObjectUri(APNote, { noteId: note.id }),
    attribution: ctx.getActorUri(note.authorId),
    url: new URL(
      `/@${author.preferredUsername}/${note.id}`,
      ctx.canonicalOrigin,
    ),
    published,
    content: note.content,
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
