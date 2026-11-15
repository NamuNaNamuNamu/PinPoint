
FROM node:22-slim

WORKDIR /app

# 依存ライブラリのインストール
COPY package*.json ./
RUN npm ci --include=dev

# ソースコードの配置
COPY . .

# React + Vite のビルド
RUN npm run build

# 実行環境
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Express + Socket.IO を起動
CMD ["npm", "start"]
