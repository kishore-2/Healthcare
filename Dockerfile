# Use official Node.js LTS image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
