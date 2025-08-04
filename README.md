# Planning Poker

Aplikacja do szacowania zadań metodą Planning Poker w zespołach Scrum.

## Funkcjonalności

- **Fibonacci Planning Poker** - karty z wartościami: 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
- **Tworzenie pokojów** - unikalny 6-znakowy kod dla każdej sesji
- **Zapraszanie uczestników** - przez kod pokoju lub bezpośredni link
- **Real-time synchronizacja** - WebSocket dla natychmiastowych aktualizacji
- **Role użytkowników** - Scrum Master (moderator) i Uczestnicy (członkowie zespołu)
- **Zarządzanie sesjami** - rozpoczynanie głosowania, ujawnianie wyników, resetowanie głosów
- **Statystyki głosowania** - średnia punktów, rozkład głosów, najczęstszy głos

## Technologie

- React + TypeScript
- Chakra UI dla interfejsu użytkownika
- Socket.IO dla komunikacji w czasie rzeczywistym
- Express.js dla serwera backend

## Uruchomienie aplikacji

### Wymagania

- Node.js
- npm

### Instalacja

```bash
# Instalacja zależności
npm install
```

### Uruchomienie w trybie deweloperskim

```bash
# Uruchomienie klienta i serwera jednocześnie
npm run dev:all

# Lub osobno:
# Uruchomienie klienta
npm run dev

# Uruchomienie serwera
npm run server
```

### Budowanie produkcyjne

```bash
npm run build
```

## Uruchomienie w Docker

### Wymagania

- Docker
- Docker Compose (opcjonalnie)

### Uruchomienie z Docker Compose (zalecane)

```bash
# Budowanie i uruchomienie aplikacji
npm run docker:up

# Zatrzymanie aplikacji
npm run docker:down
```

### Uruchomienie z Docker (ręcznie)

```bash
# Budowanie obrazu Docker
npm run docker:build

# Uruchomienie kontenera w tle (z automatycznym restartem)
npm run docker:run

# Zatrzymanie kontenera
npm run docker:stop
```

### Ręczne polecenia Docker

```bash
# Budowanie obrazu
docker build -t planning-poker .

# Uruchomienie kontenera w tle z automatycznym restartem
docker run -d --name planning-poker-app --restart unless-stopped -p 80:3000 planning-poker

# Zatrzymanie kontenera
docker stop planning-poker-app && docker rm planning-poker-app

# Uruchomienie z docker-compose
docker-compose up -d

# Zatrzymanie
docker-compose down
```

Po uruchomieniu aplikacja będzie dostępna pod adresem: `http://localhost` (port 80)

## Wdrożenie na serwerze (EC2, VPS, Cloud)

### Wymagania serwera

- Docker i Docker Compose
- Otwarte porty: 80 (HTTP) i opcjonalnie 443 (HTTPS)

### Kroki wdrożenia

1. **Sklonuj repozytorium na serwer:**
```bash
git clone <repository-url>
cd trae_poker
```

2. **Uruchom aplikację:**
```bash
# Opcja 1: Docker Compose (zalecane)
npm run docker:up

# Opcja 2: Docker ręcznie
npm run docker:build
npm run docker:run
```

3. **Sprawdź status:**
```bash
docker ps
```

4. **Aplikacja będzie dostępna pod adresem IP serwera:**
```
http://YOUR_SERVER_IP
```

### Ważne uwagi dla wdrożenia

- **Socket.IO**: Aplikacja automatycznie wykrywa adres serwera (nie używa localhost)
- **Porty**: Aplikacja mapuje port 80 (zewnętrzny) na port 3000 (wewnętrzny kontenera)
- **Restart**: Kontener automatycznie restartuje się po restarcie serwera
- **Firewall**: Upewnij się, że port 80 jest otwarty w security groups (EC2) lub firewall

### Rozwiązywanie problemów

Jeśli Socket.IO nie działa:
1. Sprawdź czy port 80 jest otwarty
2. Sprawdź logi kontenera: `docker logs planning-poker-app`
3. Sprawdź czy kontener działa: `docker ps`

## Struktura projektu

- `/src` - kod źródłowy aplikacji klienckiej
  - `/components` - komponenty React
  - `/context` - kontekst React dla zarządzania stanem
  - `/hooks` - niestandardowe hooki React
  - `/pages` - strony aplikacji
  - `/styles` - style CSS
  - `/types` - definicje typów TypeScript
  - `/utils` - funkcje pomocnicze
- `server.js` - serwer backend z obsługą WebSocket

## Użytkowanie

1. Otwórz aplikację w przeglądarce
2. Utwórz nowy pokój jako Scrum Master lub dołącz do istniejącego pokoju jako Uczestnik
3. Scrum Master może dodawać nowe zadania do oszacowania
4. Uczestnicy głosują, wybierając karty Fibonacci
5. Scrum Master ujawnia wyniki głosowania
6. Wyniki są analizowane i wyświetlane w formie statystyk
