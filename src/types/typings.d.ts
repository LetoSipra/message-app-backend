import { Prisma, PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { Context } from "graphql-ws";
import { DefaultSession } from "next-auth";

interface User {
  id: string;
  username: string | null;
}

interface Session {
  user: User & DefaultSession["user"];
}

interface GraphQLContext {
  session: Session | null;
  prisma: PrismaClient;
  pubsub: PubSub;
}

interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}
