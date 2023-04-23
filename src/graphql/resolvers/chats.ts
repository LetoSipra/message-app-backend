import { GraphQLError } from "graphql";
import { GraphQLContext } from "../../types/typings";

const resolvers = {
  Query: {
    chats: async (_: any, __: any, context: GraphQLContext) => {
      console.log("here query");
    },
  },
  Mutation: {
    createChat: async (
      _: any,
      args: { IDs: string[] },
      context: GraphQLContext
    ): Promise<{ chatId: string }> => {
      const { session, prisma } = context;
      const { IDs } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authenticated");
      }

      // const {
      //   user: { id: userId },
      // } = session;

      try {
        const chat = await prisma.chat.create({
          data: {
            chatters: {
              createMany: {
                data: IDs.map((id) => ({
                  userId: id,
                })),
              },
            },
          },
          include: {
            chatters: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        });

        return { chatId: chat.id };
      } catch (error) {
        console.log("!", error);
        throw new GraphQLError("Eroor creating new chat");
      }
    },
  },
};

export default resolvers;
