import userResolvers from "./resolvers/users.js";
import userTypeDefs from "./typeDefs/users.js";

export const resolvers = { ...userResolvers };


export const typeDefs = [userTypeDefs];
