# Build stage
FROM node:21-alpine3.18 AS builder

WORKDIR /app/cnm-server

COPY package*.json ./
COPY yarn.lock ./
COPY prisma ./prisma/
COPY .env ./
COPY tsconfig.json ./

RUN yarn global add npm
RUN yarn
RUN npx prisma generate
RUN npx prisma db push
COPY . .
RUN yarn build

# Run stage
FROM node:21-alpine3.18

WORKDIR /app/cnm-server

COPY --from=builder /app/cnm-server .

CMD [ "node", "dist/main.js" ]

# COPY deploy.prod.sh ./
# RUN chmod +x deploy.prod.sh
# RUN sudo sh deploy-prod.sh