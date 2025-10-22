# Contributing to Cosmoslide

Thanks for your interest in contributing! Here's how to get started.

## Quick Start

1. **Setup**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cosmoslide.git
   cd cosmoslide
   yarn install
   cp .env.example .env
   ```

2. **Development**
   ```bash
   docker-compose up -d  # Start PostgreSQL
   yarn dev              # Run frontend and backend
   ```

3. **Make changes**
   - Create a feature branch: `git checkout -b feature/your-feature`
   - Write tests for new features
   - Run `yarn lint && yarn test && yarn build` before committing

## Database Migrations

When you modify entities in `packages/backend/src/entities/`:

```bash
yarn migration:generate YourMigrationName
yarn migration:run
```

## Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript strict mode
- NestJS: Follow Controller → Service → Repository pattern
- React: Use functional components with hooks

## Pull Requests

1. Push your branch to your fork
2. Create PR against `main` branch
3. Ensure all checks pass
4. Respond to review feedback

## Project Structure

- `packages/backend/` - NestJS with ActivityPub (Fedify)
- `packages/frontend/` - Next.js frontend
- `packages/admin/` - Admin dashboard

See [AGENTS.md](./AGENTS.md) for detailed architecture information.

## Need Help?

- Check [GitHub Issues](https://github.com/cosmoslide/cosmoslide/issues)
- See [README.md](./README.md) for more documentation
