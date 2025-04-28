# use a small Node image
FROM node:20-alpine

# create app dir
WORKDIR /app

# copy package files & install deps
COPY package*.json ./
RUN npm install --production

# copy all source
COPY . .

# run DB migration (creates/seeds data.db)
RUN npm run migrate

# expose port
EXPOSE 8080

# start server
CMD ["npm", "start"]
