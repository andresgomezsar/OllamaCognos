# Contributing to Cognos

Thank you for your interest in contributing to Cognos! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/cognos.git`
3. Install dependencies: `npm install`
4. Copy environment file: `cp .env.example .env`
5. Configure your `.env` file with required API keys
6. Set up database: `npm run db:push`
7. Start development server: `npm run dev`

## Project Structure

### Frontend (`client/`)
- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui components
- TanStack Query for state management
- Wouter for routing

### Backend (`server/`)
- Express.js with TypeScript
- WebSocket integration for real-time chat
- Drizzle ORM for database operations
- Modular AI provider integrations

### Database (`shared/schema.ts`)
- PostgreSQL with Drizzle ORM
- Type-safe schema definitions
- Automatic migrations via `db:push`

## Code Standards

### TypeScript
- Strict mode enabled
- Use proper type definitions
- Avoid `any` types when possible
- Export types from `shared/schema.ts`

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Use React Query for data fetching
- Follow naming conventions: PascalCase for components

### API Design
- RESTful endpoints where appropriate
- WebSocket for real-time features
- Consistent error handling
- Proper HTTP status codes

## Adding Features

### New MCP Tools
1. Add tool implementation in `server/mcp.ts`
2. Register in the tool registry
3. Update routing logic in `server/mcpRouter.ts`
4. Add frontend integration if needed

### New AI Providers
1. Create client in `server/` (e.g., `newprovider.ts`)
2. Implement standard interface methods
3. Add to routing logic in `server/routes.ts`
4. Update status endpoint

### Database Changes
1. Modify schema in `shared/schema.ts`
2. Update storage interface in `server/storage.ts`
3. Run `npm run db:push` to apply changes
4. Update API endpoints if needed

### Frontend Pages
1. Add page component in `client/src/pages/`
2. Register route in `client/src/App.tsx`
3. Add navigation links if needed
4. Implement proper loading states

## Testing

### Manual Testing
- Test all AI provider routing
- Verify health data synchronization
- Check WebSocket connections
- Validate form submissions

### API Testing
```bash
# Test OpenRouter
curl -X POST /api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3.5-sonnet", "messages": [{"role": "user", "content": "test"}]}'

# Test Ollama
curl -X POST /api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-r1:32b", "messages": [{"role": "user", "content": "test"}]}'

# Test health sync
curl -X POST /api/health/sync
```

## Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(chat): add Ollama model routing
fix(health): resolve Oura API timeout issues
docs(readme): update setup instructions
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with proper commit messages
3. Test your changes thoroughly
4. Update documentation if needed
5. Push to your fork: `git push origin feature/your-feature`
6. Create a pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Test results
   - Breaking change notes if applicable

## Code Review

### What We Look For
- Code quality and readability
- Proper error handling
- Security considerations
- Performance implications
- Documentation updates

### Review Process
1. Automated checks must pass
2. At least one maintainer review
3. All conversations resolved
4. Tests passing
5. Documentation updated

## Security

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

### Health Data
- Encrypt sensitive health information
- Implement proper access controls
- Audit all data access
- Respect user privacy preferences

## Documentation

### README Updates
- Keep setup instructions current
- Update feature lists
- Maintain API documentation
- Include troubleshooting guides

### Code Comments
- Document complex business logic
- Explain non-obvious implementations
- Include usage examples
- Maintain inline documentation

## Getting Help

### Channels
- GitHub Issues for bugs and features
- Discussions for questions
- Discord/Slack for real-time help

### Issue Templates
- Bug reports: Include reproduction steps
- Feature requests: Describe use case
- Questions: Provide context

## License

By contributing to Cognos, you agree that your contributions will be licensed under the MIT License.