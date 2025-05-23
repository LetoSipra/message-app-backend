import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
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
import {
  getTokenPayload,
  getUserFromContext,
  MyJwtPayload,
  parseCookie,
} from "./util/functions.js";
import cookieParser from "cookie-parser";

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
  path: "/graphql/subscriptions",
});

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
};

const serverCleanup = useServer(
  {
    schema,
    context: (ctx) => {
      let session: MyJwtPayload | null = null;
      const cookieHeader = ctx.extra.request.headers.cookie;
      //if (!token) return;
      const cookies = parseCookie(cookieHeader);
      const token = cookies.token;

      try {
        session = getTokenPayload(token);
      } catch (err) {
        console.warn("WS auth failed:", err);
      }

      return { session, prisma, pubsub };
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
    ApolloServerPluginLandingPageLocalDefault({
      footer: false,
      embed: {
        endpointIsEditable: true,
      },
    }),
    // {
    //   async requestDidStart(requestContext) {
    //     // Within this returned object, define functions that respond
    //     // to request-specific lifecycle events.
    //     return {
    //       // The `parsingDidStart` request lifecycle event fires
    //       // when parsing begins. The event is scoped within an
    //       // associated `requestDidStart` server lifecycle event.
    //       async parsingDidStart(requestContext) {
    //         console.log("Parsing started!");
    //       },
    //       async didEncounterErrors(ctx) {
    //         console.error("🚨 GraphQL Errors:", ctx.errors);
    //       },
    //     };
    //   },
    // },
  ],
});

await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(corsOptions),
  express.json(),
  cookieParser(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      let session: MyJwtPayload | null = null;
      try {
        session = getUserFromContext({ req, res });
      } catch (err) {
        console.log("Auth error:", err);
      }
      //console.log(req.body, "first");
      return {
        prisma,
        pubsub,
        session,
        res,
      };
    },
  })
);

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
