# Deployment Guide

This guide covers deploying Cognos to various platforms and environments.

## Quick Start

### Local Development
```bash
git clone https://github.com/your-username/cognos.git
cd cognos
npm install
cp .env.example .env
# Configure your .env file
npm run db:push
npm run dev
```

### Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OURA_TOKEN` - Oura Ring personal access token

Optional:
- `OPENROUTER_API_KEY` - For cloud AI processing

## Platform-Specific Deployments

### Replit
1. Import GitHub repository to Replit
2. Configure secrets in Replit environment
3. Use Replit's PostgreSQL database
4. Deploy using Replit's deployment feature

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --database postgresql
railway deploy
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
vercel --prod
```

Note: For Vercel, you'll need to configure database separately (PlanetScale, Supabase, etc.)

### Heroku
```bash
# Create Heroku app
heroku create cognos-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OURA_TOKEN=your_token
heroku config:set OPENROUTER_API_KEY=your_key

# Deploy
git push heroku main
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t cognos .
docker run -p 5000:5000 --env-file .env cognos
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/cognos
      - OURA_TOKEN=${OURA_TOKEN}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: cognos
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Database Setup

### PostgreSQL
```sql
-- Create database
CREATE DATABASE cognos;

-- Create user (optional)
CREATE USER cognos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cognos TO cognos_user;
```

### Managed Databases
- **PlanetScale**: MySQL-compatible, serverless
- **Supabase**: PostgreSQL with real-time features
- **Railway**: Managed PostgreSQL
- **Heroku Postgres**: Add-on for Heroku apps

## Ollama Server Setup

### Local Installation
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull deepseek-r1:32b
ollama pull llama3.2-vision
ollama pull qwen3:14b
ollama serve
```

### Remote Ollama via ngrok
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Expose Ollama server
ngrok http 11434

# Use the generated URL in your app settings
```

### Docker Ollama
```bash
# Run Ollama in Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Pull models
docker exec -it ollama ollama pull deepseek-r1:32b
```

## API Key Configuration

### Oura Ring API
1. Visit [Oura Cloud](https://cloud.ouraring.com/)
2. Create developer account
3. Generate personal access token
4. Add to environment as `OURA_TOKEN`

### OpenRouter API
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create account and add credits
3. Generate API key
4. Add to environment as `OPENROUTER_API_KEY`

## Health Checks

### API Endpoints
```bash
# Application health
curl http://localhost:5000/api/status

# Database connectivity
curl http://localhost:5000/api/health

# AI provider status
curl http://localhost:5000/api/chat/completions \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"test","messages":[{"role":"user","content":"ping"}]}'
```

### System Status
The `/api/status` endpoint returns:
```json
{
  "ai": {
    "provider": "openrouter",
    "status": "connected",
    "model": "anthropic/claude-3.5-sonnet"
  },
  "ollama": {
    "status": "connected",
    "url": "http://localhost:11434",
    "model": "deepseek-r1:32b"
  },
  "oura": {
    "status": "connected",
    "configured": true
  }
}
```

## Monitoring

### Logs
- Application logs via console
- Database query logs via Drizzle
- WebSocket connection status
- API request/response logging

### Metrics
- Response times
- Error rates
- Health data sync frequency
- AI provider usage

## Security

### HTTPS
Always use HTTPS in production:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Security
- Never commit .env files
- Use platform secrets management
- Rotate API keys regularly
- Monitor access logs

## Troubleshooting

### Common Issues

**Database Connection**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check schema
npm run db:studio
```

**Ollama Connection**
```bash
# Test local Ollama
curl http://localhost:11434/api/version

# Test remote Ollama
curl -H "ngrok-skip-browser-warning: true" https://your-ngrok-url.ngrok.io/api/version
```

**Health Data Sync**
```bash
# Manual sync
curl -X POST http://localhost:5000/api/health/sync

# Check token validity
curl -H "Authorization: Bearer $OURA_TOKEN" https://api.ouraring.com/v2/usercollection/personal_info
```

### Performance Optimization
- Enable database connection pooling
- Use Redis for session storage
- Implement response caching
- Optimize database queries
- Use CDN for static assets

## Backup and Recovery

### Database Backup
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Configuration Backup
- Export environment variables
- Save API key references
- Document custom settings
- Archive database schema

## Scaling

### Horizontal Scaling
- Load balancer configuration
- Multiple app instances
- Database read replicas
- Redis for shared sessions

### Vertical Scaling
- Increase server resources
- Database performance tuning
- Memory optimization
- CPU scaling for AI workloads