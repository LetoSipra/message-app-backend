import { withFilter } from "graphql-subscriptions";
import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { userIsConversationParticipant } from "../../util/functions.js";
import { conversationPopulated } from "./conversations.js";
import {
  GraphQLContext,
  MessagePopulated,
  SendMessageArguments,
  SendMessageSubscriptionPayload,
} from "../../types/typings.js";

const resolvers = {
  Query: {
    messages: async function (
      _: Event,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<Array<MessagePopulated>> {
      const { session, prisma } = context;
      const { conversationId } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const {
        user: { id: userId },
      } = session;

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: conversationPopulated,
      });

      if (!conversation) {
        throw new GraphQLError("Conversation Not Found");
      }

      const allowedToView = userIsConversationParticipant(
        conversation.participants,
        userId
      );

      if (!allowedToView) {
        throw new Error("Not Authorized");
      }

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: "asc",
          },
        });

        return messages;
      } catch (error: unknown) {
        console.log("messages error", error);
        let message: string;
        if (error instanceof Error) {
          message = error.message;
        } else {
          message = String(error);
        }
        throw new GraphQLError(message);
      }
    },
  },
  Mutation: {
    sendMessage: async function (
      _: Event,
      args: SendMessageArguments,
      context: GraphQLContext
    ): Promise<boolean> {
      const { session, prisma, pubsub } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const { id: userId } = session.user;
      const { conversationId, body } = args;

      try {
        const newMessage = await prisma.message.create({
          data: {
            senderId: userId,
            conversationId,
            body,
          },
          include: messagePopulated,
        });

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        if (!participant) {
          throw new GraphQLError("Participant does not exist");
        }

        const { id: participantId } = participant;

        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participantId,
                },
                data: {
                  hasSeenLatestMessage: true,
                },
              },
              updateMany: {
                where: {
                  NOT: {
                    userId,
                  },
                },
                data: {
                  hasSeenLatestMessage: false,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation,
          },
        });

        return true;
      } catch (error) {
        console.log("sendMessage error", error);
        throw new GraphQLError("Error sending message");
      }
    },
  },
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_, __, context?: GraphQLContext) => {
          if (!context?.pubsub) {
            throw new GraphQLError("PubSub not provided in context");
          }
          if (!context?.session) {
            // You can return an AsyncIterator that never emits
            return context.pubsub.asyncIterator([]);
          }
          const { pubsub } = context;

          return pubsub.asyncIterator(["MESSAGE_SENT"]);
        },
        (
          payload?: SendMessageSubscriptionPayload,
          args?: { conversationId: string }
        ) => {
          if (!payload || !args?.conversationId) return false;
          return payload.messageSent.conversationId === args.conversationId;
        }
      ),
    },
  },
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
