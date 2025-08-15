# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A federated microblogging application demonstrating Fedify (ActivityPub framework) integration with NestJS. This monorepo contains:
- `packages/backend/` - NestJS backend with ActivityPub federation
- `packages/frontend/` - Next.js frontend application

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
```

## Architecture Highlights

### Federation Implementation
- **Handlers**: `activity.handler.ts`, `actor.handler.ts`, `keypair.handler.ts` in `packages/backend/src/modules/federation/handlers/`
- **Services**: `federation.service.ts` handles activity distribution, `actor-sync.service.ts` syncs remote actors
- **Entities**: Actor, Note, Follow, KeyPair in `packages/backend/src/entities/`

### Key Patterns
- Magic link authentication with JWT tokens
- ActivityPub actors with cryptographic keypairs
- TypeORM with PostgreSQL for data persistence
- Activity distribution to follower inboxes

### Environment Variables
Essential: `FEDERATION_DOMAIN`, `FEDERATION_PROTOCOL`, `DB_*`, `JWT_SECRET`, `MAIL_*`

## Development Notes

- Federation endpoints: `/@{username}`, `/@{username}/inbox`, `/@{username}/outbox`
- WebFinger discovery at `/.well-known/webfinger`
- Frontend uses Next.js App Router with React Query and Tailwind CSS
- Follow NestJS module patterns when adding features
