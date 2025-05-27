"use client";

import { ApolloLink, HttpLink, split } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { setContext } from "@apollo/client/link/context";
const GRAPHQL_HTTP = process.env.NEXT_PUBLIC_GRAPHQL_URL!;
const GRAPHQL_WS = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;

function makeClient() {
  const authLink = setContext((_, { headers }) => {
    // We only run this on the client, so localStorage is available
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
  });
  const httpLink = new HttpLink({
    uri: GRAPHQL_HTTP,
    credentials: "include",
  });
  const wsLink =
    typeof window !== "undefined"
      ? new GraphQLWsLink(
          createClient({
            url: GRAPHQL_WS,
            connectionParams: () => {
              const token = localStorage.getItem("token");
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
          })
        )
      : null;

  const splitLink =
    typeof window !== "undefined" && wsLink != null
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          wsLink,
          httpLink
        )
      : httpLink;
  const link = ApolloLink.from([authLink, splitLink]);
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: link,
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
