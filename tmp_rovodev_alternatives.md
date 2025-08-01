# 🚀 Darmowe alternatywy dla Planning Poker

## ❌ Heroku - Nie ma darmowego planu (od 2022)

## ✅ Darmowe opcje:

### 1. 🐳 Docker lokalnie (RECOMMENDED)
```bash
./deploy.sh docker
```

**Zalety:**
- ✅ Działa na 100%
- ✅ Pełna kontrola
- ✅ Wszystkie funkcje
- ✅ HTTPS z nginx
- ✅ Production ready
- ✅ Dostępne na http://localhost

**Wady:**
- ❌ Tylko lokalnie (nie publiczne)

### 2. 🌐 Fly.io (Darmowy tier)
```bash
# Zainstaluj flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Zalety:**
- ✅ 3 małe aplikacje za darmo
- ✅ Obsługuje WebSocket
- ✅ Publiczny URL
- ✅ HTTPS

### 3. 🔄 Railway (Płatny, ale trial)
- $5/miesiąc po trial
- Najlepszy dla WebSocket apps

### 4. 🌐 Netlify + Backend elsewhere
- Frontend na Netlify (darmowy)
- Backend na innej platformie

## 🎯 Rekomendacja

### Dla testów/demo:
**Docker lokalnie** - `./deploy.sh docker`

### Dla produkcji:
**Fly.io** - darmowy tier wystarczy

## 🚀 Quick start Docker

```bash
# 1. Uruchom
./deploy.sh docker

# 2. Otwórz
http://localhost

# 3. Gotowe!
```

## 💡 Fly.io setup

```bash
# 1. Zainstaluj
curl -L https://fly.io/install.sh | sh

# 2. Zaloguj
fly auth login

# 3. Deploy
fly launch --dockerfile
```