import { PrismaClient } from "@prisma/client";
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
  //pubsub
}

interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}
