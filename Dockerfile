FROM node:18-alpine

RUN npm install -g pnpm
RUN npm install -g ts-node typescript

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]
