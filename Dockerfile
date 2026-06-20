FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY src ./src

# Build TypeScript
RUN npm run build

COPY drizzle/ ./drizzle/

# Expose port (optional)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]