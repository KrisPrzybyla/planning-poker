# ☁️ AWS Deployment Guide - Planning Poker

## 🎯 AWS Options

### 1. AWS App Runner (RECOMMENDED)
**Najłatwiejsze - podobne do Render**

#### Setup:
1. Idź na AWS Console → App Runner
2. Create service → Source: GitHub
3. Wybierz repository
4. Configuration:
   - Runtime: Node.js 18
   - Build command: `npm run build`
   - Start command: `npm start`
   - Port: 3001

#### Zalety:
- ✅ Auto-deploy z GitHub
- ✅ WebSocket support
- ✅ HTTPS automatyczne
- ✅ Scaling automatyczny

#### Koszty:
- ~$2-5/miesiąc (małe użycie)
- $0.007/vCPU-minute

### 2. AWS ECS Fargate
**Container deployment**

#### Setup:
```bash
# 1. Zainstaluj AWS CLI
aws configure

# 2. Utwórz ECR repository
aws ecr create-repository --repository-name planning-poker

# 3. Build i push Docker image
docker build -t planning-poker .
docker tag planning-poker:latest [ECR-URL]
docker push [ECR-URL]

# 4. Utwórz ECS service
```

#### Zalety:
- ✅ Używa naszego Dockerfile
- ✅ Pełna kontrola
- ✅ Production ready

#### Koszty:
- ~$3-8/miesiąc

### 3. AWS EC2 (Klasyczne)
**Własny serwer**

#### Setup:
```bash
# 1. Utwórz EC2 t2.micro instance
# 2. SSH do serwera
ssh -i key.pem ec2-user@[IP]

# 3. Zainstaluj Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start

# 4. Deploy aplikację
git clone [repo]
cd planning-poker
./deploy.sh docker
```

#### Zalety:
- ✅ t2.micro darmowy (12 miesięcy)
- ✅ Pełna kontrola
- ✅ Wszystkie funkcje

#### Koszty:
- Darmowy 12 miesięcy
- Potem ~$8-10/miesiąc

## 🚀 Quick Start - App Runner

### Krok 1: AWS Console
1. Idź na https://console.aws.amazon.com
2. Wyszukaj "App Runner"
3. Create service

### Krok 2: Source
- Source type: Repository
- Provider: GitHub
- Repository: planning-poker
- Branch: main

### Krok 3: Build settings
```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm install
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3001
    env: PORT
```

### Krok 4: Service settings
- Service name: planning-poker
- Virtual CPU: 0.25 vCPU
- Memory: 0.5 GB
- Environment variables:
  - NODE_ENV=production
  - PORT=3001

## 💡 Porównanie z innymi

| Platform | Setup | Koszt | WebSocket | Recommended |
|----------|-------|-------|-----------|-------------|
| Docker lokalnie | 5 min | $0 | ✅ | ⭐⭐⭐⭐⭐ |
| Fly.io | 10 min | $0 | ✅ | ⭐⭐⭐⭐ |
| AWS App Runner | 15 min | $2-5 | ✅ | ⭐⭐⭐ |
| AWS EC2 | 30 min | $0 (1 rok) | ✅ | ⭐⭐ |
| Render | 5 min | $0 | ❌ (problemy) | ⭐ |

## 🎯 Rekomendacja

**Dla szybkiego testu:** Docker lokalnie
**Dla publicznego URL:** Fly.io
**Dla AWS experience:** App Runner