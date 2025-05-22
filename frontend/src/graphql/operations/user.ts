import { gql } from "@apollo/client";

export const UserSchema = {
  Queries: {
    searchUsers: gql`
      query SearchUsers($username: String!) {
        searchUsers(username: $username) {
          id
          username
        }
      }
    `,
    getCurrentUser: gql`
      query GetCurrentUser {
        getCurrentUser {
          id
          username
        }
      }
    `,
  },
  Mutations: {
    createUsername: gql`
      mutation CreateUsername($username: String!) {
        createUsername(username: $username) {
          success
          error
        }
      }
    `,
    login: gql`
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          user {
            id
            username
          }
          token
        }
      }
    `,
    signIn: gql`
      mutation SignIn($username: String!, $password: String!) {
        signIn(username: $username, password: $password) {
          user {
            id
          }
        }
      }
    `,
  },
  Subscriptions: {},
};
