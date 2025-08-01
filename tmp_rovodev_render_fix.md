# 🔧 Render Fix - Static Files

## Problem
```
Planning Poker server running on port 10000
Cannot GET /
```

## Przyczyna
Server działa, ale nie serwuje plików frontend (React build).

## ✅ Rozwiązanie zastosowane

### 1. Dodano serwowanie plików statycznych
```typescript
// Serve static files from React build
app.use(express.static(path.join(__dirname, '../../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});
```

### 2. Dodano import path
```typescript
import path from 'path';
```

## 🚀 Deploy poprawki

```bash
# 1. Commit changes
git add .
git commit -m "Fix: Add static file serving for production"

# 2. Push to GitHub
git push

# 3. Render auto-redeploy (2-3 min)
```

## 🎯 Po redeploy

Aplikacja będzie dostępna pod:
- **Frontend**: https://planning-poker-xxxx.onrender.com/
- **Health**: https://planning-poker-xxxx.onrender.com/health
- **WebSocket**: Automatycznie

## ✅ Test checklist

Po redeploy sprawdź:
- [ ] Strona główna ładuje się
- [ ] Można utworzyć pokój
- [ ] Można dołączyć do pokoju
- [ ] WebSocket działa (real-time)
- [ ] Invite links działają

## 🎉 Gotowe!

Planning Poker będzie w pełni funkcjonalny z:
- ✅ Frontend + Backend w jednej aplikacji
- ✅ HTTPS
- ✅ WebSocket
- ✅ Real-time collaboration