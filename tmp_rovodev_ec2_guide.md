# 🖥️ AWS EC2 Deployment Guide

## 🎯 AWS EC2 Free Tier
- **t2.micro**: Darmowy przez 12 miesięcy
- **750 godzin/miesiąc**: Wystarczy na 24/7
- **30 GB storage**: Więcej niż potrzeba
- **Pełna kontrola**: Root access

## 📋 Krok 1: Utwórz EC2 Instance

### AWS Console:
1. Idź na https://console.aws.amazon.com
2. Services → EC2
3. Kliknij **"Launch Instance"**

### Instance Configuration:
- **Name**: planning-poker
- **AMI**: Amazon Linux 2 AMI (Free tier eligible)
- **Instance type**: t2.micro (Free tier eligible)
- **Key pair**: Create new key pair
  - Name: planning-poker-key
  - Type: RSA
  - Format: .pem
  - **POBIERZ I ZAPISZ KLUCZ!**

### Network Settings:
- **VPC**: Default
- **Subnet**: Default
- **Auto-assign public IP**: Enable
- **Security group**: Create new
  - SSH (22): Your IP
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0
  - Custom TCP (3001): 0.0.0.0/0

### Storage:
- **Size**: 8 GB (Free tier)
- **Type**: gp2

## 📋 Krok 2: Połącz się z serwerem

### Download key i ustaw permissions:
```bash
chmod 400 planning-poker-key.pem
```

### SSH do serwera:
```bash
ssh -i planning-poker-key.pem ec2-user@[EC2-PUBLIC-IP]
```

**Znajdź PUBLIC IP w AWS Console → EC2 → Instances**

## 📋 Krok 3: Setup serwera

### Automatyczny setup:
```bash
# Skopiuj i uruchom setup script
curl -o setup.sh https://raw.githubusercontent.com/USERNAME/planning-poker/main/tmp_rovodev_ec2_setup.sh
chmod +x setup.sh
./setup.sh
```

### Lub manualnie:
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git

# Logout and login again for Docker permissions
exit
```

## 📋 Krok 4: Deploy aplikacji

### SSH ponownie i deploy:
```bash
ssh -i planning-poker-key.pem ec2-user@[EC2-PUBLIC-IP]

# Clone repository
git clone https://github.com/USERNAME/planning-poker.git
cd planning-poker

# Deploy with Docker
./deploy.sh docker
```

## 🌐 Krok 5: Dostęp do aplikacji

**URL**: http://[EC2-PUBLIC-IP]

### Test:
1. Otwórz http://[EC2-PUBLIC-IP]
2. Utwórz pokój Planning Poker
3. Przetestuj wszystkie funkcje
4. WebSocket będzie działać perfectly!

## 🔧 Zarządzanie

### Sprawdź status:
```bash
docker ps
docker logs planning-poker
```

### Restart aplikacji:
```bash
cd planning-poker
docker-compose restart
```

### Update aplikacji:
```bash
cd planning-poker
git pull
docker-compose down
docker-compose up -d --build
```

### Logi:
```bash
docker logs -f planning-poker
```

## 🔒 Security

### Firewall (opcjonalnie):
```bash
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL Certificate (opcjonalnie):
```bash
# Install Certbot
sudo yum install -y certbot
sudo certbot certonly --standalone -d your-domain.com
```

## 💰 Koszty

**Free Tier (12 miesięcy):**
- t2.micro: $0
- 30 GB storage: $0
- Data transfer: 15 GB/miesiąc gratis

**Po Free Tier:**
- t2.micro: ~$8-10/miesiąc
- Storage: ~$3/miesiąc
- **Total**: ~$11-13/miesiąc

## 🎉 Gotowe!

Twoja aplikacja Planning Poker będzie dostępna 24/7 na:
**http://[EC2-PUBLIC-IP]**

Z pełnym wsparciem:
- ✅ WebSocket real-time
- ✅ Wszystkie funkcje
- ✅ Pełna kontrola
- ✅ Darmowy przez rok!