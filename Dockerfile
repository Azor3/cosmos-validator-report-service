# Node.js resmi imajını kullan
FROM node:18-alpine

# Çalışma dizinini oluştur
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Uygulama kodlarını kopyala
COPY . .

EXPOSE 8080 

# Uygulamayı başlat
CMD ["node", "app.js"]

# Sağlık kontrolü için
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"