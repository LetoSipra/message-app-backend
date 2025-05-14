import conversationResolvers from "./resolvers/conversations.js";
import messageResolvers from "./resolvers/messages.js";
import userResolvers from "./resolvers/users.js";
import scalarResolvers from "./resolvers/scalars.js";
import { mergeResolvers } from "@graphql-tools/merge";
import userTypeDefs from "./typeDefs/users.js";
import conversationTypeDefs from "./typeDefs/conversations.js";
import messageTypeDefs from "./typeDefs/messages.js";

export const resolvers = mergeResolvers([
  userResolvers,
  scalarResolvers,
  conversationResolvers,
  messageResolvers,
]);

export const typeDefs = [userTypeDefs, conversationTypeDefs, messageTypeDefs];
