import { withFilter } from "graphql-subscriptions";
import { GraphQLError } from "graphql";
import {
  ConversationCreatedSubscriptionPayload,
  ConversationDeletedSubscriptionPayload,
  ConversationPopulated,
  ConversationUpdatedSubscriptionData,
  GraphQLContext,
} from "../../types/typings.js";
import { userIsConversationParticipant } from "../../util/functions.js";
import { Prisma } from "@prisma/client";

const resolvers = {
  Query: {
    conversations: async function getConversations(
      _: Event,
      __: Event,
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
          orderBy: { updatedAt: "desc" },
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
    conversation: async function Conversation(
      _: Event,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<ConversationPopulated> {
      const { session, prisma } = context;
      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }
      const { id } = session.user;

      try {
        const { conversationId } = args;
        const conversationParticipants = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
          },
          include: conversationPopulated,
        });
        if (!conversationParticipants) {
          throw new GraphQLError("Conversation not found");
        }

        const isParticipant = conversationParticipants.participants.some(
          (p) => p.user.id === id
        );

        if (!isParticipant) {
          throw new GraphQLError("Not authorized to view this conversation");
        }
        return conversationParticipants;
      } catch (error) {
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

      // 2) Build a deduplicated array of participant IDs
      //    (and make sure the current user is included)
      const uniqueIds = Array.from(new Set([...participantIds, userId]));

      // 3) Look for an existing conversation whose participants exactly match `uniqueIds`
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          // For each ID in uniqueIds, there must be “some” participant with that userId
          AND: uniqueIds.map((id) => ({
            participants: {
              some: { userId: id },
            },
          })),
          // And every participant in the conversation must come from uniqueIds
          participants: {
            every: {
              userId: { in: uniqueIds },
            },
          },
        },
        include: conversationPopulated, // whatever you normally include
      });

      if (existingConversation) {
        throw new GraphQLError("Conversation Exist");
      }

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
      const { session, prisma, pubsub } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }
      // 1) Fetch the participant record for this user + conversation
      const participant = await prisma.conversationParticipant.findFirst({
        where: { userId, conversationId },
        select: { hasSeenLatestMessage: true },
      });
      if (!participant) {
        throw new GraphQLError("Not authorized or participant not found");
      }

      // 2) If they’ve already seen the latest message, do nothing
      if (participant.hasSeenLatestMessage) {
        return false;
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

        // 2) Re-fetch the full conversation (with participants & latestMessage)
        //    so we can send exactly the same shape the subscription expects:
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: conversationPopulated, // same include used elsewhere
        });
        if (!conversation) {
          throw new GraphQLError("Conversation not found");
        }

        // 3) Publish to “CONVERSATION_UPDATED” so subscribers are notified.
        //    We only changed “hasSeenLatestMessage” on one participant,
        //    so we can send `addedUserIds`/`removedUserIds` as empty arrays,
        //    or omit them entirely. The important part is the “conversation” payload.
        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation: conversation,
            addedUserIds: [],
            removedUserIds: [],
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
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { latestMessageId: null },
        });
        const deletedConversation = await prisma.conversation.delete({
          where: { id: conversationId },
          include: {
            participants: true, // <─ make sure we get the array here
          },
        });

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

          return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
        },
        (
          payload: ConversationCreatedSubscriptionPayload,
          _,
          context?: GraphQLContext
        ) => {
          if (!context?.session) {
            throw new GraphQLError("Not authorized");
          }
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Not authorized");
          }

          const { id: userId } = session.user;
          const {
            conversationCreated: { participants },
          } = payload;

          return userIsConversationParticipant(participants, userId);
        }
      ),
    },
    conversationUpdated: {
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

          return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
        },
        (
          payload: ConversationUpdatedSubscriptionData,
          _,
          context?: GraphQLContext
        ) => {
          if (!context?.session) {
            throw new GraphQLError("Not authorized");
          }
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Not authorized");
          }

          const { id: userId } = session.user;
          const {
            conversationUpdated: {
              conversation: { participants },
              // addedUserIds,
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
            removedUserIds &&
            Boolean(removedUserIds.find((id) => id === userId));

          return (
            (userIsParticipant && !userSentLatestMessage) ||
            userSentLatestMessage ||
            userIsBeingRemoved
          );
        }
      ),
    },
    conversationDeleted: {
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

          return pubsub.asyncIterator(["CONVERSATION_DELETED"]);
        },
        (
          payload: ConversationDeletedSubscriptionPayload,
          _,
          context?: GraphQLContext
        ) => {
          if (!context?.session) {
            throw new GraphQLError("Not authorized");
          }
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError("Not authorized");
          }

          const { id: userId } = session.user;
          const {
            conversationDeleted: { participants },
          } = payload;

          return userIsConversationParticipant(participants, userId);
        }
      ),
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
