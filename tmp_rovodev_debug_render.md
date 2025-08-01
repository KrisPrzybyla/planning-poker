# 🔍 Render Debug Guide

## Problem
- ✅ `/health` endpoint działa (200)
- ❌ `/` główna strona nie działa (404)
- ❌ Static files nie są serwowane

## 🎯 Sprawdź w Render Dashboard

### 1. Logs Build
Idź do: **Render Dashboard → Twój Service → Logs**

Szukaj:
```
Building...
npm install
npm run build
```

**Sprawdź czy:**
- [ ] `cd server && npm install` - sukces?
- [ ] `npm run build` (server) - sukces?
- [ ] `cd ../client && npm install` - sukces?
- [ ] `npm run build` (client) - sukces?
- [ ] Folder `client/build` został utworzony?

### 2. Logs Runtime
Szukaj:
```
Planning Poker server running on port 10000
```

**Sprawdź czy:**
- [ ] Server startuje bez błędów?
- [ ] Są błędy 404 w logach?
- [ ] Ścieżka do `client/build` jest poprawna?

### 3. Environment
**Sprawdź Environment Variables:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`

## 🔧 Możliwe rozwiązania

### Rozwiązanie 1: Sprawdź ścieżkę
Problem może być w ścieżce do `client/build`.

W server/src/index.ts sprawdź:
```typescript
app.use(express.static(path.join(__dirname, '../../client/build')));
```

### Rozwiązanie 2: Debug ścieżki
Dodaj debug log:
```typescript
console.log('Static path:', path.join(__dirname, '../../client/build'));
console.log('Files in build:', fs.readdirSync(path.join(__dirname, '../../client/build')));
```

### Rozwiązanie 3: Alternatywna ścieżka
Spróbuj:
```typescript
app.use(express.static(path.join(process.cwd(), 'client/build')));
```

## 🚨 Jeśli nic nie pomaga

### Plan B: Heroku
```bash
./deploy.sh heroku
```

### Plan C: Docker lokalnie
```bash
./deploy.sh docker
```

## 📋 Co sprawdzić w logach

1. **Build logs** - czy client/build został utworzony?
2. **Runtime logs** - czy są błędy 404?
3. **File structure** - czy pliki są w odpowiednim miejscu?
4. **Path resolution** - czy ścieżka jest poprawna?

## 💡 Następne kroki

1. Sprawdź logi w Render
2. Znajdź konkretny błąd
3. Zastosuj odpowiednią poprawkę
4. Lub przejdź na Heroku (które na pewno zadziała)