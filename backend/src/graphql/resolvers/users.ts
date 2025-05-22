import { GraphQLError } from "graphql";
import { verifyAndCreateUsername } from "../../util/functions.js";
import {
  CreateUsernameResponse,
  GraphQLContext,
  SearchedUser,
} from "../../types/typings.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const resolvers = {
  Query: {
    searchUsers: async function searchUsers(
      _: Event,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Array<User>> {
      const { username: searchedUsername } = args;
      const { prisma, session } = context;
      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const {
        user: { username: myUsername },
      } = session;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchedUsername,
              not: myUsername,
              mode: "insensitive",
            },
          },
        });

        return users;
      } catch (error: unknown) {
        console.log("error", error);
        let message: string;
        if (error instanceof Error) {
          message = error.message;
        } else {
          message = String(error);
        }
        throw new GraphQLError(message);
      }
    },
    getCurrentUser: async function getCurrentUser(
      _: Event,
      __: Event,
      context: GraphQLContext
    ): Promise<SearchedUser> {
      const { session } = context;
      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      // 3) Return the minimal user object
      return session.user;
    },
  },
  Mutation: {
    createUsername: async function createUsername(
      _: Event,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> {
      const { session, prisma } = context;

      if (!session?.user) {
        return {
          error: "Not authorized",
        };
      }

      const { id } = session.user;
      const { username } = args;

      return await verifyAndCreateUsername({ userId: id, username }, prisma);
    },
    signIn: async function signIn(
      _: Event,
      args: { username: string; password: string },
      context: GraphQLContext
    ): Promise<{ token: string; user: User }> {
      const { prisma } = context;
      const { username } = args;
      const password = await bcrypt.hash(args.password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password,
        },
      });

      const token = jwt.sign({ user }, process.env.JWT_SECRET || "");

      return { token, user };
    },
    login: async function login(
      _: Event,
      args: { username: string; password: string },
      context: GraphQLContext
    ): Promise<{ token: string; user: User }> {
      const { prisma, res } = context;
      const user = await prisma.user.findUnique({
        where: {
          username: args.username,
        },
      });
      if (!user) {
        throw new GraphQLError("Invalid credentials");
      }
      const isValid = await bcrypt.compare(args.password, user.password);

      if (!isValid) {
        throw new GraphQLError("Invalid credentials");
      }

      const token = jwt.sign({ user }, process.env.JWT_SECRET || "", {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { token, user };
    },
    signOut: async function signOut(
      _: Event,
      __: unknown,
      context: GraphQLContext
    ): Promise<boolean> {
      const { res } = context;

      res.clearCookie("token");
      return true;
    },
  },
};

export default resolvers;
