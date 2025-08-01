# ✅ Render Deployment Checklist

## 🎯 Kroki do wykonania:

### 1. Otwórz Render
- [ ] Idź na https://render.com
- [ ] Kliknij "Get Started for Free"
- [ ] Zaloguj się przez GitHub

### 2. Utwórz Web Service  
- [ ] Kliknij "New +"
- [ ] Wybierz "Web Service"
- [ ] Znajdź repo "planning-poker"
- [ ] Kliknij "Connect"

### 3. Sprawdź konfigurację
Render powinien automatycznie wykryć:
- [ ] **Name:** planning-poker
- [ ] **Environment:** Node
- [ ] **Build Command:** (z render.yaml)
- [ ] **Start Command:** node server/dist/index.js
- [ ] **Plan:** Free

### 4. Deploy
- [ ] Kliknij "Create Web Service"
- [ ] Czekaj na build (5-10 min)
- [ ] Sprawdź logi

### 5. Test
Po deploy:
- [ ] Otwórz URL: https://planning-poker-xxxx.onrender.com
- [ ] Przetestuj tworzenie pokoju
- [ ] Przetestuj zapraszanie
- [ ] Sprawdź WebSocket (real-time)

## 🚨 Troubleshooting

### Build fails?
- Sprawdź logi w Render dashboard
- Upewnij się że render.yaml jest w root directory
- Sprawdź czy wszystkie pliki są w repo

### App nie odpowiada?
- Sprawdź health check: /health
- Sprawdź environment variables
- Sprawdź port (powinien być 3001)

### WebSocket nie działa?
- Render automatycznie obsługuje WebSocket
- Sprawdź czy używasz HTTPS (nie HTTP)
- Sprawdź CORS settings

## 🎉 Po sukcesie

Twoja aplikacja Planning Poker będzie dostępna pod:
**https://planning-poker-xxxx.onrender.com**

Z pełnym wsparciem:
- ✅ HTTPS
- ✅ WebSocket  
- ✅ Real-time collaboration
- ✅ Invite links
- ✅ Mobile responsive

**Udostępnij URL zespołowi i ciesz się Planning Poker! 🃏**