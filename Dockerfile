
FROM node:18-buster-slim

# Create app directory, this is in our container/in our image
WORKDIR /app/cnm-server


COPY package*.json ./
COPY prisma ./prisma/

# COPY ENV variable
COPY .env ./

COPY tsconfig.json ./

RUN apt-get -qy update && apt-get -qy install openssl
RUN npm install --force
RUN npx prisma generate
RUN npx prisma db push
# If you are building your code for production
# RUN yarn ci --only=production

# Bundle app source
COPY . .

RUN npm run build

CMD [ "node", "dist/main.js" ]


