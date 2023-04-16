// npm install @apollo/server express graphql cors body-parser
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http, { get } from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs, resolvers } from "./graphql/schema.js";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { getSession } from "next-auth/react";
import { GraphQLContext, Session } from "./types/typings.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

//Prisma Client
const prisma = new PrismaClient();

//GraphQL Main Schema
const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

// Express Middleware configuration
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
};

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/",
  cors<cors.CorsRequest>(corsOptions),
  bodyParser.json(),
  cookieParser(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req, res }): Promise<GraphQLContext> => {
      //I had problems with fetching session and this was the only thing that worked
      const token: string = req.cookies["next-auth.session-token"];
      const session = (await getSession({
        req: {
          headers: {
            cookie: `next-auth.session-token=${token}`,
          },
        },
      })) as Session | null; //when I add custom session to next-auth.d.ts it work perfectly as expected but typescript throws compile errors(problem is typescript related), so I had to manually type
      return { session, prisma };
    },
  })
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
