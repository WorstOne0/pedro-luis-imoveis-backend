FROM node:21-alpine

# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable

WORKDIR /app
COPY . .

RUN npm install
# RUN pnpm run start

EXPOSE ${PORT}

CMD ["npm", "start"]