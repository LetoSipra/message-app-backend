import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { userIsConversationParticipant } from "../../util/functions.js";
import {
  ConversationCreatedSubscriptionPayload,
  ConversationDeletedSubscriptionPayload,
  ConversationPopulated,
  ConversationUpdatedSubscriptionData,
  GraphQLContext,
} from "../../types/typings.js";

const resolvers = {
  Query: {
    conversations: async function getConversations(
      _: Event,
      args: Record<string, never>,
      context: GraphQLContext
    ): Promise<Array<ConversationPopulated>> {
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      try {
        const { id } = session.user;

        const conversations = await prisma.conversation.findMany({
          where: {
            participants: {
              some: {
                userId: {
                  equals: id,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        return conversations;
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
  },
  Mutation: {
    createConversation: async function (
      _: Event,
      args: { participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> {
      const { session, prisma, pubsub } = context;
      const { participantIds } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const { id: userId } = session.user;

      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId,
                })),
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish("CONVERSATION_CREATED", {
          conversationCreated: conversation,
        });

        return { conversationId: conversation.id };
      } catch (error) {
        console.log("createConversation error", error);
        throw new GraphQLError("Error creating conversation");
      }
    },
    markConversationAsRead: async function (
      _: Event,
      args: { userId: string; conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId, conversationId } = args;
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      try {
        await prisma.conversationParticipant.updateMany({
          where: {
            userId,
            conversationId,
          },
          data: {
            hasSeenLatestMessage: true,
          },
        });

        return true;
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
    deleteConversation: async function (
      _: Event,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { session, prisma, pubsub } = context;
      const { conversationId } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      try {
        const [deletedConversation] = await prisma.$transaction([
          prisma.conversation.delete({
            where: {
              id: conversationId,
            },
            include: conversationPopulated,
          }),
          prisma.conversationParticipant.deleteMany({
            where: {
              conversationId,
            },
          }),
          prisma.message.deleteMany({
            where: {
              conversationId,
            },
          }),
        ]);

        pubsub.publish("CONVERSATION_DELETED", {
          conversationDeleted: deletedConversation,
        });

        return true;
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
    updateParticipants: async function (
      _: Event,
      args: { conversationId: string; participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<boolean> {
      const { session, prisma, pubsub } = context;
      const { conversationId, participantIds } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      // const {
      //   user: { id: userId },
      // } = session;

      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversationId,
          },
        });

        const existingParticipants = participants.map((p) => p.userId);

        const participantsToDelete = existingParticipants.filter(
          (id) => !participantIds.includes(id)
        );

        const participantsToCreate = participantIds.filter(
          (id) => !existingParticipants.includes(id)
        );

        const transactionStatements = [
          prisma.conversation.update({
            where: {
              id: conversationId,
            },
            data: {
              participants: {
                deleteMany: {
                  userId: {
                    in: participantsToDelete,
                  },
                  conversationId,
                },
              },
            },
            include: conversationPopulated,
          }),
        ];

        if (participantsToCreate.length) {
          transactionStatements.push(
            prisma.conversation.update({
              where: {
                id: conversationId,
              },
              data: {
                participants: {
                  createMany: {
                    data: participantsToCreate.map((id) => ({
                      userId: id,
                      hasSeenLatestMessage: true,
                    })),
                  },
                },
              },
              include: conversationPopulated,
            })
          );
        }

        const [deleteUpdate, addUpdate] = await prisma.$transaction(
          transactionStatements
        );

        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation: addUpdate || deleteUpdate,
            addedUserIds: participantsToCreate,
            removedUserIds: participantsToDelete,
          },
        });

        return true;
      } catch (error: unknown) {
        console.log("updateParticipants error", error);
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
  Subscription: {
    conversationCreated: {
      subscribe: (
        payload: ConversationCreatedSubscriptionPayload,
        _: Event,
        context: GraphQLContext
      ) => {
        const { session, pubsub } = context;
        if (!session?.user) {
          throw new GraphQLError("Not authorized");
        }

        const { id: userId } = session.user;
        const {
          conversationCreated: { participants },
        } = payload;

        return (
          userIsConversationParticipant(participants, userId),
          pubsub.asyncIterator(["CONVERSATION_CREATED"])
        );
      },
    },
    conversationUpdated: {
      subscribe: (
        payload: ConversationUpdatedSubscriptionData,
        _: Event,
        context: GraphQLContext
      ) => {
        const { session, pubsub } = context;

        if (!session?.user) {
          throw new GraphQLError("Not authorized");
        }

        const { id: userId } = session.user;
        const {
          conversationUpdated: {
            conversation: { participants },

            removedUserIds,
          },
        } = payload;

        const userIsParticipant = userIsConversationParticipant(
          participants,
          userId
        );

        const userSentLatestMessage =
          payload.conversationUpdated.conversation.latestMessage?.senderId ===
          userId;

        const userIsBeingRemoved =
          removedUserIds && Boolean(removedUserIds.find((id) => id === userId));

        return (
          pubsub.asyncIterator(["CONVERSATION_UPDATED"]),
          (userIsParticipant && !userSentLatestMessage) ||
            userSentLatestMessage ||
            userIsBeingRemoved
        );
      },
    },
    conversationDeleted: {
      subscribe: (
        payload: ConversationDeletedSubscriptionPayload,
        _: Event,
        context: GraphQLContext
      ) => {
        const { session, pubsub } = context;

        if (!session?.user) {
          throw new GraphQLError("Not authorized");
        }

        const { id: userId } = session.user;
        const {
          conversationDeleted: { participants },
        } = payload;

        return (
          pubsub.asyncIterableIterator(["CONVERSATION_DELETED"]),
          userIsConversationParticipant(participants, userId)
        );
      },
    },
  },
};

export const participantPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
  });

export default resolvers;
