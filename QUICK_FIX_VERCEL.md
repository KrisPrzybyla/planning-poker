# 🚨 Szybka poprawka dla Vercel

## Problem
Vercel ma ograniczenia z WebSocket. Tworzenie pokoju nie działa.

## ⚡ Natychmiastowe rozwiązanie

### Opcja 1: Railway (Najlepsze)
```bash
# Zainstaluj Railway CLI
npm install -g @railway/cli

# Zaloguj się
railway login

# Deploy (automatycznie wykryje Dockerfile)
railway up

# Lub użyj naszego skryptu
./deploy.sh railway
```

### Opcja 2: Render (Darmowe)
1. Idź na https://render.com
2. Połącz z GitHub
3. Wybierz repository
4. Render automatycznie użyje `render.yaml`

### Opcja 3: Heroku (Klasyczne)
```bash
# Zainstaluj Heroku CLI
# Potem:
./deploy.sh heroku
```

## 🔧 Dlaczego Vercel nie działa?

Vercel to platforma serverless - każdy request to nowa instancja.
WebSocket potrzebuje persistent connection.

**Planning Poker potrzebuje:**
- ✅ Persistent connections (WebSocket)
- ✅ Shared state (pokoje, użytkownicy)
- ✅ Real-time communication

**Vercel oferuje:**
- ❌ Serverless functions (stateless)
- ❌ Brak persistent connections
- ❌ Każdy request = nowa instancja

## 🎯 Rekomendacja

**Railway** - najlepsze dla tej aplikacji:
- ✅ Pełne wsparcie WebSocket
- ✅ Persistent state
- ✅ Darmowy tier
- ✅ Auto-deploy z Git
- ✅ Łatwa konfiguracja

## 🚀 Deploy na Railway w 2 minuty

```bash
# 1. Zainstaluj CLI
npm install -g @railway/cli

# 2. Zaloguj się (otworzy przeglądarkę)
railway login

# 3. Deploy
railway up

# 4. Gotowe! Railway da Ci URL
```

Railway automatycznie:
- Wykryje Dockerfile
- Zbuduje aplikację
- Wdroży z HTTPS
- Da publiczny URL

## 📊 Porównanie szybkie

| Platform | Setup Time | WebSocket | Free Tier | URL |
|----------|------------|-----------|-----------|-----|
| Railway  | 2 min      | ✅        | ✅        | ⭐ |
| Render   | 5 min      | ✅        | ✅        | ✅ |
| Heroku   | 10 min     | ✅        | Limited   | ✅ |
| Vercel   | 1 min      | ❌        | ✅        | ❌ |

**Wniosek: Railway = najszybsze + najlepsze dla Planning Poker**