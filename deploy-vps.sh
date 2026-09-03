#!/bin/bash
set -e

echo "=========================================="
echo "🚀 SUARA AI - VPS Backend Auto Deployment"
echo "=========================================="

# 1. Update system packages
echo "📦 1. Memeriksa & Menginstall dependensi sistem..."
sudo apt-get update -y
sudo apt-get install -y curl git docker.io docker-compose ffmpeg nginx certbot python3-certbot-nginx

# 2. Enable & start docker
echo "🐳 2. Mengaktifkan Docker Service..."
sudo systemctl enable --now docker

# 3. Build & Run backend container
echo "⚙️ 3. Menjalankan Docker Compose backend..."
sudo docker-compose down || true
sudo docker-compose build --no-cache
sudo docker-compose up -d

# 4. Wait for health check
echo "⏳ 4. Menunggu Backend aktif di port 7860..."
sleep 5
for i in {1..10}; do
  if curl -s http://127.0.0.1:7860/health | grep -q "ok"; then
    echo "✅ Backend FastAPI Berhasil Berjalan!"
    break
  fi
  echo "Menunggu container siap ($i/10)..."
  sleep 3
done

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT BACKEND SUKSES!"
echo "Endpoint API: http://$(curl -s ifconfig.me):7860"
echo "Test Health : curl http://$(curl -s ifconfig.me):7860/health"
echo "=========================================="
