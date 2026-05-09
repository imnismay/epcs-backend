# Use the official Node.js 20 image (standard for 2026)
FROM node:20

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy local code to the container image
COPY . .

# Expose the port your app runs on (matching your server.js)
EXPOSE 5000

# Run the web service on container startup
CMD [ "node", "server.js" ]