# AGENTS.md

This file provides guidance to Claude Code/Gemini CLI/OpenAI Codex when working with code in this repository.

## Project Overview

A federated microblogging application demonstrating Fedify (ActivityPub framework) integration with NestJS. This monorepo contains:
- `packages/backend/` - NestJS backend with ActivityPub federation
- `packages/frontend/` - Next.js frontend application
- `packages/admin/` - Admin dashboard application

## Key Commands

```bash
# Development
yarn dev                    # Run frontend and backend concurrently
docker-compose up          # Run with PostgreSQL included

# Building & Testing
yarn build                 # Build all packages
yarn test                  # Run tests
yarn lint                  # Lint code

# Database Setup
cp .env.example .env       # Configure environment variables
# PostgreSQL is auto-configured with docker-compose

# Database Migrations (Rails-style workflow)
yarn migration:generate <Name>  # Auto-detect entity changes and create migration
yarn migration:run              # Apply pending migrations
yarn migration:revert           # Rollback last migration
```

## Architecture Highlights

### Federation Implementation
- **Handlers**: `actor.handler.ts`, `nodeinfo.handler.ts`, `object-dispatcher.handler.ts` in `packages/backend/src/modules/federation/handlers/`
- **Services**: `federation.service.ts` handles activity distribution, `actor-sync.service.ts` syncs remote actors, `context.service.ts` for ActivityPub contexts
- **Entities**: Actor, Note, Follow, KeyPair, User, Presentation, TimelinePost, Invitation, MagicLink in `packages/backend/src/entities/`

### Key Patterns
- Magic link authentication with JWT tokens
- ActivityPub actors with cryptographic keypairs
- TypeORM with PostgreSQL for data persistence
- Activity distribution to follower inboxes

### Environment Variables
Essential: `FEDERATION_*`, `FEDERATION_PROTOCOL`, `DB_*`, `JWT_SECRET`, `MAIL_*`, `INSTANCE_ACTOR_KEY`

## Database Migration Workflow

### Development Environment
We use a **dual-database approach** for seamless development with automatic migrations:

- **Main DB (port 5432)**: `synchronize=true` - Entity changes auto-applied for hot reload
- **Migration DB (port 5433)**: `synchronize=false` - Clean state for migration generation

### Workflow
1. **Modify entities** in `packages/backend/src/entities/`
2. **Generate migration**: `yarn migration:generate AddUserRole`
   - Compares entities with migration DB (5433)
   - Detects differences and creates migration file
   - Auto-applies migration to migration DB to keep it in sync
3. **Commit** the generated migration file
4. **Production deployment**: Migrations run automatically (`migrationsRun=true`)

### Commands
```bash
# Create migration from entity changes
yarn migration:generate <MigrationName>

# Manually run pending migrations (dev DB)
yarn migration:run

# Rollback last migration
yarn migration:revert
```

### Why This Approach?
- ✅ Hot reload during development (main DB with synchronize)
- ✅ Automatic migration generation (comparing with clean migration DB)
- ✅ Production-safe (migration-based deployment)
- ✅ Rails-like developer experience

## Code Quality Standards

### Type Safety Rules

1. **No `any` casting** - `: any` and `as any` are not allowed
   - Use proper interfaces or type definitions
   - For unknown error types in catch blocks, use `catch (error: unknown)` with type guards
   - Example: `if (error instanceof Error) { ... }`

2. **Entity creation/updates** - Prefer `Partial<Model>` or `DeepPartial<Model>`
   - TypeORM's `create()` and `save()` work well with these types
   - Avoids manual type assertions

3. **Error handling** - Use `Result` type for type-safe, predictable error handling
   - See `packages/admin/src/lib/result.ts` for implementation
   - Pattern: `Result<T, E>` where success returns `Ok(value)` and failure returns `Err(error)`
   - Compose error types as discriminated unions (e.g., `NetworkError | NotFoundError`)

4. **Clean code principles**
   - Single Responsibility: Each function/class should do one thing well
   - Explicit over implicit: Prefer clear types over inference when it aids readability
   - Fail fast: Validate inputs early and return errors explicitly

### ActivityPub / Federation

- We use **Fedify** for ActivityPub implementation
- Reference documentation: https://fedify.dev
- Key Fedify types: `Person`, `Note`, `Follow`, `Accept`, `Create`, `Announce`
- Actor handlers are in `packages/backend/src/modules/federation/handlers/`

## Development Notes

- Federation endpoints: `/@{username}`, `/@{username}/inbox`, `/@{username}/outbox`
- WebFinger discovery at `/.well-known/webfinger`
- Frontend uses Next.js App Router with React Query and Tailwind CSS
- Follow NestJS module patterns when adding features
