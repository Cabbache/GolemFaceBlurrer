# Stage 1: Build the React app
FROM node:20.10 AS builder

# Set the working directory in the container to the React app directory
WORKDIR /app

# Assuming your React app is in a directory named "my-react-app" next to the Dockerfile
# Copy package.json and package-lock.json (if available) to the container
COPY webapp/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code into the container
COPY webapp/ .

# Build the app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 to the outside once the container has launched
EXPOSE 80

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]
