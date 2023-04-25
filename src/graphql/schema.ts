import userResolvers from "./resolvers/users.js";
import userTypeDefs from "./typeDefs/users.js";
import chatResolvers from "./resolvers/chats.js";
import chatTypeDefs from "./typeDefs/chats.js";
import { mergeResolvers } from "@graphql-tools/merge";
import merge from "deepmerge";

const toolsmerge = mergeResolvers([chatResolvers, userResolvers]);
const deepmerge = merge(chatResolvers, userResolvers);
export const resolvers = toolsmerge;

export const typeDefs = [userTypeDefs, chatTypeDefs];
