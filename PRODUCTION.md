# Planning Poker - Uruchomienie Produkcyjne

## Wymagania

- **Node.js 20+** (wymagane przez Vite 7.1.0)
- **npm** (dołączony z Node.js)

## Szybkie uruchomienie

### Opcja 1: Automatyczny skrypt
```bash
./start-production.sh
```

### Opcja 2: Ręczne uruchomienie
```bash
# 1. Upewnij się, że używasz Node.js 20+
nvm use 20  # jeśli używasz nvm

# 2. Zbuduj aplikację (jeśli nie została zbudowana)
npm run build

# 3. Uruchom na porcie 80 (wymaga sudo)
sudo PORT=80 npm start

# LUB uruchom na innym porcie (bez sudo)
PORT=3000 npm start
PORT=8080 npm start
```

## Szczegółowe instrukcje

### 1. Przygotowanie środowiska

#### Sprawdź wersję Node.js:
```bash
node --version
```

Jeśli masz wersję niższą niż 20.0.0, zainstaluj nowszą:

**Z nvm (zalecane):**
```bash
nvm install 20
nvm use 20
```

**Lub pobierz z oficjalnej strony:**
https://nodejs.org/

### 2. Instalacja zależności
```bash
npm install
```

### 3. Budowanie aplikacji
```bash
npm run build
```

To polecenie:
- Kompiluje TypeScript (`tsc -b`)
- Buduje aplikację React z Vite (`vite build`)
- Tworzy katalog `dist/` z plikami statycznymi

### 4. Uruchomienie serwera

#### Na porcie 80 (standardowy HTTP):
```bash
sudo PORT=80 npm start
```

**Uwaga:** Port 80 wymaga uprawnień administratora (sudo) na większości systemów.

#### Na innym porcie:
```bash
PORT=3000 npm start  # Port 3000
PORT=8080 npm start  # Port 8080
```

### 5. Weryfikacja

Aplikacja będzie dostępna pod adresem:
- **Port 80:** http://localhost
- **Port 3000:** http://localhost:3000
- **Port 8080:** http://localhost:8080

#### Sprawdź status zdrowia:
```bash
curl http://localhost/api/health
```

## Konfiguracja produkcyjna

### Zmienne środowiskowe

- `PORT` - port serwera (domyślnie 3000)
- `NODE_ENV` - środowisko (automatycznie ustawiane na "production" w trybie produkcyjnym)
- `TRUST_PROXY` - ustaw na `true`, jeśli aplikacja działa za reverse proxy/CDN (Nginx, Cloudflare). Umożliwia poprawne odczytanie IP klienta i lepsze działanie rate-limitingu.
- `API_RATE_WINDOW_MS` - okno czasowe dla limitowania zapytań (w milisekundach). Domyślnie `60000` (60s).
- `API_RATE_MAX` - maksymalna liczba zapytań na IP w oknie. Domyślnie `180`.

### Przykład uruchomienia z konfiguracją:
```bash
NODE_ENV=production PORT=80 npm start
```

## Architektura

Aplikacja składa się z:

1. **Serwer Express** (`server.js`)
   - Serwuje pliki statyczne z katalogu `dist/`
   - Obsługuje API endpoints (`/api/*`)
   - Zarządza połączeniami Socket.IO

2. **Aplikacja React** (zbudowana w `dist/`)
   - Single Page Application (SPA)
   - Wszystkie route'y są obsługiwane przez React Router

3. **Socket.IO**
   - Komunikacja w czasie rzeczywistym
   - Zarządzanie pokojami i głosowaniem

## Rozwiązywanie problemów

### Problem: "Permission denied" na porcie 80
**Rozwiązanie:** Użyj `sudo` lub uruchom na innym porcie:
```bash
PORT=3000 npm start
```

### Problem: "Module not found" lub błędy budowania
**Rozwiązanie:** Sprawdź wersję Node.js i przeinstaluj zależności:
```bash
node --version  # Powinno być 20+
rm -rf node_modules
npm install
npm run build
```

### Problem: Aplikacja nie ładuje się w przeglądarce
**Rozwiązanie:** Sprawdź czy serwer działa i czy pliki zostały zbudowane:
```bash
curl http://localhost/api/health
ls -la dist/
```

## Monitoring

### Sprawdzenie statusu serwera:
```bash
curl http://localhost/api/health | jq .
```

### Sprawdzenie statystyk:
```bash
curl http://localhost/api/stats | jq .
```

## Zatrzymywanie serwera

Naciśnij `Ctrl+C` w terminalu gdzie uruchomiony jest serwer.

## Automatyczne uruchamianie (opcjonalne)

Możesz skonfigurować automatyczne uruchamianie przy starcie systemu używając:
- **systemd** (Linux)
- **launchd** (macOS)
- **PM2** (cross-platform)

### Przykład z PM2:
```bash
npm install -g pm2
pm2 start npm --name "planning-poker" -- start
pm2 startup
pm2 save
```