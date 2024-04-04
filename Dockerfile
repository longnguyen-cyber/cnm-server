FROM node:21-alpine3.18

# Create app directory, this is in our container/in our image
WORKDIR /app/cnm-server

COPY package*.json ./
COPY yarn.lock ./
COPY prisma ./prisma/

# COPY ENV variable
COPY .env ./

COPY tsconfig.json ./
RUN yarn global add npm
RUN yarn
RUN npx prisma generate
RUN npx prisma db push
# If you are building your code for production
# RUN yarn ci --only=production

# Bundle app source
COPY . .

RUN yarn build

CMD [ "node", "dist/main.js" ]