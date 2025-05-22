import { gql } from "@apollo/client";

export const MessageFields = `
  id
  sender {
    id
    username
  }
  body
  createdAt
`;

export const MessageSchema = {
  Query: {
    messages: gql`
      query Messages($conversationId: String!) {
        messages(conversationId: $conversationId) {
          ${MessageFields}
        }
      }
    `,
  },
  Mutations: {
    sendMessage: gql`
      mutation SendMessage($conversationId: String!, $body: String!) {
        sendMessage(conversationId: $conversationId, body: $body)
      }
    `,
  },
  Subscriptions: {
    messageSent: gql`
      subscription MessageSent($conversationId: String!) {
        messageSent(conversationId: $conversationId) {
          ${MessageFields}
        }
      }
    `,
  },
};
