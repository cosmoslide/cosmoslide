<div style="text-align: center">
  <img src="logo-with-typography.png" width=320 />
</div>

# Cosmoslide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Cosmoslide** is a federated platform for sharing presentations and microblogging, built on the ActivityPub protocol. It combines the social aspects of microblogging with PDF presentation sharing, allowing users to share knowledge while maintaining ownership of their content.

## Features

- **Federated microblogging** - Share posts across the fediverse
- **PDF presentation sharing** - Upload and share PDF files up to 200MB
- **PDF preview** - In-browser PDF viewing with native browser controls
- **S3-compatible storage** - Works with Cloudflare R2, AWS S3, or any S3-compatible service
- **ActivityPub support** - Compatible with Mastodon, Pleroma, and other federated platforms
- **Magic link authentication** - Secure, passwordless login
- **User-owned content** - Your data stays with you

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Yarn package manager
- Docker & Docker Compose (recommended)

### Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/cosmoslide.git
cd cosmoslide

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Run with Docker (recommended)
docker-compose up

# Or run locally
yarn dev
```

Access the application at:
- **Admin Panel**: `http://localhost:3004`
- **Backend API**: `http://localhost:3000`
- **V1 Frontend**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

### Production Deployment

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with production values (DB password, domain, etc.)

# 2. Build and run production containers
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

Production services will be available at:
- **Admin**: `https://admin.cosmosli.de`
- **API**: `https://api.cosmosli.de`
- **V1**: `https://v1.cosmosli.de`
- **V2**: `https://v2.cosmosli.de` (coming soon)

For detailed deployment instructions, see [Production Deployment Guide](docs/production-deployment.md).

## Documentation

- [Design Document](docs/DESIGN.md) - Architecture and roadmap
- [Federation](docs/FEDERATION.md) - ActivityPub implementation details
- [Contributing](CONTRIBUTING.md) - How to contribute

## Tech Stack

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Fedify](https://fedify.dev/) - ActivityPub implementation
- [PostgreSQL](https://www.postgresql.org/) - Database
- [TypeScript](https://www.typescriptlang.org/) - Language

## Development

```bash
yarn dev          # Start development servers
yarn build        # Build for production
yarn test         # Run tests
yarn lint         # Lint code
```

## Federation

Cosmoslide implements the ActivityPub protocol for federation:

- WebFinger: `/.well-known/webfinger`
- Actor endpoint: `/@{username}`
- Inbox/Outbox: `/@{username}/inbox`, `/@{username}/outbox`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Copyright (C) 2025 Cosmoslide Contributors

Licensed under the [MIT License](LICENSE).
