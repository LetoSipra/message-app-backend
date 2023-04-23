import userResolvers from "./resolvers/users.js";
import userTypeDefs from "./typeDefs/users.js";
import chatResolvers from "./resolvers/chats.js";
import chatTypeDefs from "./typeDefs/chats.js";

export const resolvers = { ...userResolvers, ...chatResolvers };

export const typeDefs = [userTypeDefs, chatTypeDefs];
