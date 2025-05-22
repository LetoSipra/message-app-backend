import { ExpressContextFunctionArgument } from "@apollo/server/dist/esm/express4";
import jwt, { JwtPayload } from "jsonwebtoken";
import { GraphQLError } from "graphql";
import {
  CreateUsernameResponse,
  ParticipantPopulated,
  User,
} from "../types/typings";
import { PrismaClient } from "@prisma/client";

export interface MyJwtPayload extends JwtPayload {
  user: User;
}

/** type‑guard that narrows unknown → MyJwtPayload */
function isMyJwtPayload(x: unknown): x is MyJwtPayload {
  return (
    typeof x === "object" &&
    x !== null &&
    "user" in x &&
    typeof x.user === "object"
  );
}

/** core JWT verification */
export function getTokenPayload(token: string): MyJwtPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new GraphQLError("JWT_SECRET not set");

  const decoded = jwt.verify(token, secret);
  if (isMyJwtPayload(decoded)) {
    return decoded;
  }
  return null;
}

export function parseCookie(
  header: string | undefined
): Record<string, string> {
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawVal] = part.split("=");
    const key = rawKey.trim();
    const val = rawVal.join("=").trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

/**
 * Looks for the JWT in either:
 *  • req.cookies.token
 *  • req.headers.authorization
 *  • the explicit `authToken` argument
 */
export function getUserFromContext(
  ctx: ExpressContextFunctionArgument,
  authToken?: string
): MyJwtPayload | null {
  const { req } = ctx;
  // 1) check cookie first (populated by cookie‑parser)
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === "string") {
    return getTokenPayload(cookieToken);
  }

  // 2) fallback to Authorization header
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.substring(7);
    return getTokenPayload(token);
  }

  // 3) fallback to explicit arg
  if (authToken) {
    return getTokenPayload(authToken);
  }

  return null;
}

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
