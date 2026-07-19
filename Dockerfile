FROM node:22-alpine

WORKDIR /app

# Dependencies are copied and installed before the source so this layer is
# reused whenever only application code changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production

# Run as the unprivileged user the node image already provides.
USER node

EXPOSE ${PORT}

CMD ["npm", "start"]
