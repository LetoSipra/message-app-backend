import {
  CreateUsernameResponse,
  GraphQLContext,
  User,
} from "../../types/typings";
import { GraphQLError } from "graphql";

const resolvers = {
  Query: {
    searchUsers: async (
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<User[]> => {
      
      const { username: searchedUsers } = args;
      const { prisma, session } = context;

      if (!session?.user) {
        throw new GraphQLError(
          "You are not authorized to perform this action.",
          {
            extensions: {
              code: "FORBIDDEN",
            },
          }
        );
      }

      const {
        user: { username: sameUsername },
      } = session;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchedUsers,
              not: sameUsername,
              mode: "insensitive",
            },
          },
        });

        return users;
      } catch (error) {
        console.log("Failed to search user", error);
        throw new GraphQLError("Failed to search user", {
          extensions: {
            code: "Failed",
          },
        });
      }
    },
  },

  Mutation: {
    createUsername: async (
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> => {
      console.log("here", args);
      
      const { username } = args;
      const { prisma, session } = context;

      if (!session?.user) {
        return {
          error: "User not found",
        };
      }

      const { id } = session.user;
      try {
        const checkUsernameAvailability = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (checkUsernameAvailability) {
          return {
            error: "Username is not available",
          };
        }

        await prisma.user.update({
          where: {
            id: id,
          },
          data: {
            username,
          },
        });

        return { success: true };
      } catch (error) {
        console.log("Failed to create username", error);
        return {
          error: "Failed to create username",
        };
      }
    },
  },
};

export default resolvers;
