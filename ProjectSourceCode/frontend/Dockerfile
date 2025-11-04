# Use a lightweight Node image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Expose the app’s port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
