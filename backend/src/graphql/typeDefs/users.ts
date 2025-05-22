import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type User {
    id: String
    username: String
  }

  type Query {
    searchUsers(username: String!): [User]
    getCurrentUser: User
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Mutation {
    createUsername(username: String!): CreateUsernameResponse
    signIn(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    signOut: Boolean
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }
`;

export default typeDefs;
