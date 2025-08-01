# 🚀 AWS App Runner - Krok po kroku

## 📋 Checklist

### Przygotowanie
- [x] GitHub repo gotowe
- [x] apprunner.yaml utworzony
- [ ] apprunner.yaml w repo (git push)
- [ ] AWS konto (darmowe)

### AWS Console Setup
- [ ] Zaloguj się na AWS Console
- [ ] Wyszukaj "App Runner"
- [ ] Kliknij "Create service"

### Source Configuration
- [ ] Source type: **Repository**
- [ ] Provider: **GitHub**
- [ ] Connect to GitHub (autoryzacja)
- [ ] Repository: **planning-poker**
- [ ] Branch: **main**
- [ ] Deployment trigger: **Automatic**

### Build Configuration
- [ ] Configuration source: **Use a configuration file**
- [ ] Configuration file: **apprunner.yaml**
- [ ] AWS wykryje automatycznie

### Service Configuration
- [ ] Service name: **planning-poker**
- [ ] Virtual CPU: **0.25 vCPU**
- [ ] Memory: **0.5 GB**
- [ ] Auto scaling: **Default**

### Environment Variables
- [ ] NODE_ENV = **production**
- [ ] PORT = **3001**

### Security & Networking
- [ ] Instance role: **Default**
- [ ] VPC: **Default**
- [ ] Security: **Default**

### Review & Create
- [ ] Review all settings
- [ ] Kliknij **Create & deploy**
- [ ] Czekaj 5-10 minut

## 🎯 Po deploy

### Sprawdź:
- [ ] Service status: **Running**
- [ ] Health check: **Healthy**
- [ ] URL dostępny
- [ ] Frontend ładuje się
- [ ] WebSocket działa
- [ ] Planning Poker funkcjonalny

### URL będzie w formacie:
```
https://xxx.region.awsapprunner.com
```

## 💰 Koszty

**Szacowane dla Planning Poker:**
- 0.25 vCPU × $0.007/min = ~$3-5/miesiąc
- 0.5 GB RAM × $0.0008/min = ~$1/miesiąc
- **Total: ~$4-6/miesiąc**

## 🚨 Troubleshooting

### Build fails?
- Sprawdź logi w App Runner console
- Upewnij się że apprunner.yaml jest w root
- Sprawdź czy wszystkie dependencies są w package.json

### Service nie startuje?
- Sprawdź environment variables
- Sprawdź port (3001)
- Sprawdź health check endpoint (/health)

### WebSocket nie działa?
- App Runner automatycznie obsługuje WebSocket
- Sprawdź czy używasz HTTPS
- Sprawdź CORS settings

## 🎉 Sukces!

Po udanym deploy będziesz mieć:
- ✅ Publiczny HTTPS URL
- ✅ Auto-deploy z GitHub
- ✅ WebSocket support
- ✅ Professional hosting
- ✅ Planning Poker w pełni funkcjonalny!