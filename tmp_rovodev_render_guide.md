# 🎨 Render Deployment - Szybki Guide

## 🎯 Dlaczego Render?
- ✅ **Darmowy tier** - wystarczy dla Planning Poker
- ✅ **WebSocket support** - pełne wsparcie real-time
- ✅ **Auto-deploy** - push do Git = deploy
- ✅ **HTTPS** - automatyczne certyfikaty
- ✅ **Zero config** - używa naszego render.yaml

## 🚀 Deploy w 5 minut

### KROK 1: Przygotuj GitHub
```bash
# Jeśli nie masz repo na GitHub:
git init
git add .
git commit -m "Planning Poker app"
git branch -M main
git remote add origin https://github.com/USERNAME/planning-poker.git
git push -u origin main
```

### KROK 2: Render Setup
1. Idź na **https://render.com**
2. Kliknij **"Get Started for Free"**
3. Zaloguj się przez **GitHub**
4. Kliknij **"New +"** → **"Web Service"**
5. Wybierz repository **planning-poker**
6. Kliknij **"Connect"**

### KROK 3: Konfiguracja (automatyczna)
Render automatycznie wykryje:
- ✅ `render.yaml` - nasza konfiguracja
- ✅ `Dockerfile` - build instructions
- ✅ Environment variables
- ✅ Health checks

### KROK 4: Deploy
1. Kliknij **"Create Web Service"**
2. Render rozpocznie build (5-10 min)
3. Otrzymasz URL: `https://planning-poker-xxxx.onrender.com`

## 🔧 Render.yaml (już gotowe)
```yaml
services:
  - type: web
    name: planning-poker
    env: node
    buildCommand: |
      cd server && npm install && npm run build &&
      cd ../client && npm install && npm run build
    startCommand: node server/dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    healthCheckPath: /health
```

## 🎉 Po deploy
- **URL**: https://planning-poker-xxxx.onrender.com
- **HTTPS**: Automatyczne
- **WebSocket**: Działa perfectly
- **Auto-deploy**: Push to Git = deploy

## 💡 Alternatywy

### Heroku (jeśli Render nie działa)
```bash
./deploy.sh heroku
```

### Docker na VPS
```bash
./deploy.sh docker
```

## 🎯 Następne kroki
1. Deploy na Render
2. Przetestuj aplikację
3. Udostępnij URL zespołowi
4. Enjoy Planning Poker! 🃏