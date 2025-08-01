# 🚀 Planning Poker - Deployment Guide

## Quick Deploy Options

### 🎯 One-Click Deployments

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/planning-poker)

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/planning-poker)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/planning-poker)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/planning-poker)

---

## 🛠️ Manual Deployment

### Prerequisites
- Node.js 16+ 
- npm 8+
- Git

### 1. 🐳 Docker Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/planning-poker.git
cd planning-poker

# Deploy with Docker Compose
docker-compose up -d

# Or use deployment script
chmod +x deploy.sh
./deploy.sh docker
```

**Access:** http://localhost

### 2. ▲ Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
./deploy.sh vercel
# or
vercel --prod
```

**Features:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Custom domains

### 3. 🚂 Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
./deploy.sh railway
# or
railway login
railway up
```

**Features:**
- ✅ Automatic deployments
- ✅ Built-in databases
- ✅ Environment variables
- ✅ Custom domains

### 4. 🎨 Render Deployment

1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-deploy using `render.yaml`

```bash
./deploy.sh render
```

**Features:**
- ✅ Auto-deploy from Git
- ✅ Free SSL certificates
- ✅ DDoS protection
- ✅ Health checks

### 5. 💜 Heroku Deployment

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Deploy
./deploy.sh heroku
# or
heroku create planning-poker-app
git push heroku main
```

**Features:**
- ✅ Easy scaling
- ✅ Add-ons ecosystem
- ✅ Review apps
- ✅ Pipeline deployments

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |

### Production Optimizations

- ✅ Gzip compression
- ✅ Static file caching
- ✅ Security headers
- ✅ Rate limiting
- ✅ Health checks
- ✅ Error handling

---

## 🏗️ Build Process

### Automatic Build Steps:
1. Install dependencies
2. Build TypeScript server
3. Build React client
4. Optimize assets
5. Generate production bundle

### Manual Build:
```bash
npm run build
npm start
```

---

## 🔒 Security Features

- HTTPS enforcement
- CORS protection
- Rate limiting
- Security headers
- Input validation
- XSS protection

---

## 📊 Monitoring

### Health Checks
- **Endpoint:** `/health`
- **Response:** `{"status":"OK","rooms":0}`

### Metrics to Monitor
- Active rooms count
- Connected users
- Response times
- Error rates
- Memory usage

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

---

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails**
   ```bash
   npm run clean
   npm install
   npm run build
   ```

2. **WebSocket Connection Issues**
   - Check CORS settings
   - Verify proxy configuration
   - Enable WebSocket support

3. **Static Files Not Loading**
   - Check build output
   - Verify nginx configuration
   - Check file permissions

### Debug Mode:
```bash
NODE_ENV=development npm start
```

---

## 📈 Scaling

### Horizontal Scaling
- Load balancer with sticky sessions
- Redis for session storage
- Database for persistent data

### Vertical Scaling
- Increase memory/CPU
- Optimize bundle size
- Enable caching

---

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Error tracking enabled
- [ ] Performance monitoring
- [ ] Security headers enabled

---

## 🆘 Support

For deployment issues:
1. Check logs: `docker logs planning-poker`
2. Verify health: `curl https://your-domain.com/health`
3. Monitor metrics in platform dashboard

**Happy deploying! 🚀**