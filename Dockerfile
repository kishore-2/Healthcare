# Use official Node.js 20 base image
FROM node:20

# Install build tools for better-sqlite3 (needed!)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (build native modules)
RUN npm install

# Copy rest of the application code
COPY . .

# Run migration to create data.db
RUN npm run migrate

# Set environment variable
ENV NODE_ENV=production

# Expose port (use 8080 because Azure expects this for Linux apps)
EXPOSE 8080

# Start server
CMD ["npm", "start"]
