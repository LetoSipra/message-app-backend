import { PrismaClient } from "@prisma/client";
import { CreateUsernameResponse, ParticipantPopulated } from "../types/typings";

export async function verifyAndCreateUsername(
  args: { userId: string; username: string },
  prisma: PrismaClient
): Promise<CreateUsernameResponse> {
  const { userId, username } = args;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      return {
        error: "Username already taken. Try another",
      };
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        username,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.log("createUsername error", error);
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    return {
      error: message,
    };
  }
}

export function userIsConversationParticipant(
  participants: Array<ParticipantPopulated>,
  userId: string
): boolean {
  return !!participants.find((participant) => participant.userId === userId);
}
