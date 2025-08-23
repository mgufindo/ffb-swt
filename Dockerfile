# Use official Node.js runtime as base image
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Jalankan test dulu
RUN npm test

COPY . .

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
