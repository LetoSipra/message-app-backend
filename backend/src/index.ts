import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import cors from "cors";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { typeDefs, resolvers } from "./graphql/schema.js";
import { PrismaClient } from "@prisma/client";

const redisOptions = `${process.env.REDIS_URL}`;

export const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions",
});

const serverCleanup = useServer(
  {
    schema,
    context: (ctx) => {
      if (ctx.connectionParams && ctx.connectionParams.session) {
        const { session } = ctx.connectionParams;
        return { session, prisma, pubsub };
      }
      return { session: null, prisma, pubsub };
    },
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),

    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

app.use(
  "/",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async () => {
      const session = {
        user: {
          id: "FAKE_USER_ID",
          name: "Dev User",
          email: "dev@example.com",
          username: "devuser",
        },
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      };

      return { prisma, pubsub, session };
    },
  })
);

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
