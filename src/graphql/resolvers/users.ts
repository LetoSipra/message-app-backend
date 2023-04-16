import { CreateUsernameResponse, GraphQLContext } from "../../types/typings";

const resolvers = {
  Query: {
    searchUsers: () => {},
  },
  Mutation: {
    createUsername: async (
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> => {
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
