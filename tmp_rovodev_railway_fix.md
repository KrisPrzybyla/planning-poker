# 🔗 Railway Project Setup Fix

## Problem
```
No linked project found. Run railway link to connect to a project
```

## ✅ Rozwiązanie

### KROK 1: Utwórz nowy projekt
```bash
railway init
```

**Co się stanie:**
1. Railway zapyta o nazwę projektu
2. Wpisz: `planning-poker` (lub dowolną nazwę)
3. Railway utworzy projekt w chmurze
4. Połączy lokalny folder z projektem

### KROK 2: Deploy
```bash
railway up
```

## 🎯 Pełna sekwencja poleceń

```bash
# 1. Zaloguj się (jeśli jeszcze nie)
railway login

# 2. Utwórz projekt
railway init

# 3. Deploy
railway up

# 4. Sprawdź status
railway status
```

## 💡 Co Railway zapyta

### Przy `railway init`:
```
? Enter project name: planning-poker
? Select a team: Personal (lub wybierz team)
✅ Project created successfully!
```

### Przy `railway up`:
```
? Select a service: Create new service
? Enter service name: web
? Select source: Current directory
✅ Building and deploying...
```

## 🚀 Po sukcesie

Railway pokaże:
```
✅ Deployment successful!
🌐 URL: https://planning-poker-production-xxxx.up.railway.app
```

## 🔧 Dodatkowe komendy

```bash
# Zobacz logi
railway logs

# Sprawdź status
railway status

# Otwórz w przeglądarce
railway open

# Dodaj custom domain
railway domain
```

## 🎉 Gotowe!

Twoja aplikacja Planning Poker będzie dostępna pod publicznym URL z pełnym wsparciem WebSocket!