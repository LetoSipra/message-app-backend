import { GraphQLError } from "graphql";
import { GraphQLContext, SubscriptionPayload } from "../../types/typings";
import { withFilter } from "graphql-subscriptions";

const resolvers = {
  Query: {
    chats: async (_: any, __: any, context: GraphQLContext) => {
      const { session, prisma } = context;
      if (!session) {
        throw new GraphQLError("Not authenticated");
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const chats = await prisma.chat.findMany({
          where: {
            chatters: {
              some: {
                userId: {
                  equals: userId,
                },
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

        return chats;
      } catch (error) {
        console.log("Query error", error);
        throw new GraphQLError("Query Error");
      }
    },
  },
  Mutation: {
    createChat: async (
      _: any,
      args: { IDs: string[] },
      context: GraphQLContext
    ): Promise<{ chatId: string }> => {
      const { session, prisma, pubsub } = context;
      const { IDs } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authenticated");
      }

      const {
        user: { id: userId },
      } = session;

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

        pubsub.publish("CHAT_CREATED", {
          chatCreated: chat,
        });

        return { chatId: chat.id };
      } catch (error) {
        console.log("!", error);
        throw new GraphQLError("Eroor creating new chat");
      }
    },
  },

  Subscription: {
    chatCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CHAT_CREATED"]);
        },
        (payload: SubscriptionPayload, _: any, context: GraphQLContext) => {
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Not authenticated");
          }

          // const { id: userId } = session.user;

          const {
            chatCreated: { chatters },
          } = payload;
          chatters.map((user) => console.log(user));
          const userIsChatter = !!chatters.find(
            (chatter) => chatter.user.id === session.user.id
          );
          return userIsChatter;
        }
      ),
    },
  },
};

export default resolvers;
