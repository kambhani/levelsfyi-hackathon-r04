FROM oven/bun:1 AS base
WORKDIR /app
COPY . .
RUN apt update
RUN bun install --frozen-lockfile --production
EXPOSE 5000
CMD ["bun", "run", "start"]