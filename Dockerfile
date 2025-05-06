# Stage 1: Development environment
FROM node:18.16-alpine AS dev

# Set the working directory inside the container
WORKDIR /app

# Copy all files into the development stage
COPY . .

# Install all dependencies (including dev dependencies)
RUN npm install

# Stage 2: Production environment
FROM dev AS base

# Set the working directory inside the container
WORKDIR /app

# Copy only necessary files from the development stage
COPY --from=dev /app/app.js /app/
COPY --from=dev /app/cloudflare.js /app/
COPY --from=dev /app/req.js /app/
COPY --from=dev /app/session.js /app/
COPY --from=dev /app/config.json /app/
COPY --from=dev /app/node_modules /app/node_modules

# Command to run the application
CMD ["node", "app.js"]
