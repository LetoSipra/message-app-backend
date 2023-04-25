import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type Mutation {
    createChat(IDs: [String]): CreateResponse
  }

  type CreateResponse {
    chatId: String
  }

  type Chat {
    id: String
    chatters: [Chatter]
    createdAt: Date
    updatedAt: Date
  }
  type Chatter {
    id: String
    user: User
  }

  type Query {
    chats: [Chat]
  }

  type Subscription {
    chatCreated: Chat
  }
`;

export default typeDefs;
