import { Note as APNote, Context, Create, Image, Person } from '@fedify/fedify';
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
  return new Create({
    id: new URL('#create', note.id ?? ctx.origin),
    object: new APNote({
      id: ctx.getObjectUri(APNote, { noteId: note.id }),
      attribution: ctx.getActorUri(note.authorId),
      url: new URL(
        `/@${author.preferredUsername}/${note.id}`,
        ctx.canonicalOrigin,
      ),
      published: new Temporal.Instant(BigInt(note.publishedAt.getTime())),
      content: note.content,
      tos: [],
      ccs: [],
    }),
  });
};
