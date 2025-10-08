FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/admin/package.json ./packages/admin/

RUN yarn install --frozen-lockfile

COPY packages/admin ./packages/admin

WORKDIR /app/packages/admin

EXPOSE 3000

CMD ["yarn", "dev", "--host", "0.0.0.0"]
