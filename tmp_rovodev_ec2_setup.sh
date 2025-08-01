#!/bin/bash

# AWS EC2 Setup Script for Planning Poker
echo "🖥️ AWS EC2 Setup - Planning Poker"
echo "================================="

# Update system
echo "📦 Updating system..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📥 Installing Git..."
sudo yum install -y git

# Install Node.js (for local development)
echo "📦 Installing Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Clone your repository:"
echo "   git clone https://github.com/USERNAME/planning-poker.git"
echo ""
echo "2. Deploy with Docker:"
echo "   cd planning-poker"
echo "   ./deploy.sh docker"
echo ""
echo "3. Access your app:"
echo "   http://[EC2-PUBLIC-IP]"
echo ""
echo "🔧 Useful commands:"
echo "docker ps                 # Check running containers"
echo "docker logs planning-poker # Check app logs"
echo "sudo service docker start # Start Docker if needed"