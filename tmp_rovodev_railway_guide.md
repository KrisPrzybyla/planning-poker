# 🚂 Railway Deployment Guide - Krok po Kroku

## 🎯 KROK 1: Instalacja Railway CLI

### Windows:
```bash
npm install -g @railway/cli
```

### Mac/Linux:
```bash
npm install -g @railway/cli
# lub
curl -fsSL https://railway.app/install.sh | sh
```

### Sprawdź instalację:
```bash
railway --version
```

---

## 🎯 KROK 2: Logowanie

```bash
railway login
```

**Co się stanie:**
1. Otworzy się przeglądarka
2. Zaloguj się przez GitHub/Google/Email
3. Autoryzuj Railway CLI
4. Wróć do terminala

---

## 🎯 KROK 3: Deploy

```bash
railway up
```

**Co Railway zrobi automatycznie:**
1. ✅ Wykryje Dockerfile
2. ✅ Zbuduje aplikację w chmurze
3. ✅ Wdroży z HTTPS
4. ✅ Przydzieli publiczny URL
5. ✅ Skonfiguruje environment variables

---

## 🎯 KROK 4: Sprawdzenie

Po deploy Railway pokaże:
```
✅ Deployment successful!
🌐 URL: https://planning-poker-production-xxxx.up.railway.app
```

**Otwórz URL i przetestuj:**
1. Utwórz pokój
2. Skopiuj link zaproszenia
3. Otwórz w nowej karcie
4. Przetestuj głosowanie

---

## 🔧 KROK 5: Konfiguracja (opcjonalna)

### Dodaj custom domain:
```bash
railway domain
```

### Sprawdź logi:
```bash
railway logs
```

### Sprawdź status:
```bash
railway status
```

---

## 🚨 Troubleshooting

### Problem: "railway: command not found"
```bash
# Sprawdź PATH
echo $PATH
# Reinstaluj
npm uninstall -g @railway/cli
npm install -g @railway/cli
```

### Problem: Build fails
```bash
# Sprawdź logi
railway logs
# Często pomaga restart
railway redeploy
```

### Problem: WebSocket nie działa
- Railway automatycznie obsługuje WebSocket
- Sprawdź czy używasz HTTPS (nie HTTP)

---

## ✅ Checklist

- [ ] Railway CLI zainstalowane
- [ ] Zalogowany do Railway
- [ ] `railway up` wykonane
- [ ] URL otrzymany
- [ ] Aplikacja działa
- [ ] WebSocket połączony
- [ ] Tworzenie pokojów działa
- [ ] Zapraszanie działa

---

## 🎉 Po sukcesie

**Twoja aplikacja Planning Poker jest live!**

- 🌐 **URL**: https://twoja-aplikacja.up.railway.app
- 🔒 **HTTPS**: Automatyczne
- 🚀 **WebSocket**: Pełne wsparcie
- 📱 **Mobile**: Responsive design
- 🔗 **Zaproszenia**: Działają perfectly

**Udostępnij URL zespołowi i ciesz się Planning Poker! 🃏**