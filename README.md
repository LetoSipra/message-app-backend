A real‑time messaging application with a GraphQL Apollo Server backend built on Node.js, TypeScript, Prisma, Redis Pub/Sub, and WebSockets, paired with a Next.js frontend using Tailwind CSS & Server Components.

Supports user authentication, conversations, messaging, and live, real‑time subscriptions.

---

## Features

- **User management**: sign up, sign in/out, create username
- **Conversations**: create, list, delete, update participants, mark as read
- **Messages**: send, fetch, real‑time updates
- **Subscriptions** via WebSockets: live notifications for new conversations & messages
- **Persistence** with MongoDB (via Prisma)
- **Pub/Sub** powered by Redis for scalable real‑time events
- **JWT‑based authentication**

---

## Tech Stack

- **Backend**

  - Node.js & TypeScript
  - Apollo Server (GraphQL API)
  - Prisma ORM (PostgreSQL)
  - Redis (ioredis + graphql-redis-subscriptions)
  - WebSockets (graphql-ws + ws)
  - bcrypt for password hashing
  - jsonwebtoken for auth tokens
  - cookie-parser for cookie handling

- **Frontend**

  - Next.js (v15.3.2) for server-rendered React apps
  - React (v19.1.0) for UI
  - Apollo Client (including @apollo/client-integration-nextjs) for data fetching
  - graphql & graphql-ws for real-time GraphQL subscriptions
  - Tailwind CSS & tailwind-scrollbar for styling
  - lucide-react for icons
  - sonner for toast notifications
  - zod for schema validation

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/<your‑username>/message-app-backend.git
cd message-app-backend
npm install
```

### 2. Environment Variables

Backend env.

```bash
CLIENT_ORIGIN="frontend"
MONGODB_URI="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
REDIS_URL="redis://HOST:PORT"
JWT_SECRET="your_jwt_secret_key"
```

Frontend env.

```bash
NEXT_PUBLIC_WEBSOCKET_URL="websocket"
NEXT_PUBLIC_GRAPHQL_URL="backend"
```

---

## GraphQL API

### Schema Overview

- **Scalars**

  - `Date`

- **Types**

  - `User`, `AuthPayload`, `Conversation`, `Participant`, `Message`
  - Response wrappers: `CreateConversationResponse`, `ConversationDeletedResponse`, `ConversationUpdatedSubscriptionPayload`

### Queries

```graphql
# Fetch all conversations for the current user
query conversations: [Conversation]

# Fetch one conversation by ID
query conversation(conversationId: String!): Conversation

# Search for users by username
query searchUsers(username: String!): [User]

# Get the currently signed‑in user
query getCurrentUser: User

# Fetch messages for a conversation
query messages(conversationId: String): [Message]
```

### Mutations

```graphql
# User / Auth
mutation createUsername(username: String!): CreateUsernameResponse
mutation signIn(username: String!, password: String!): AuthPayload
mutation login(username: String!, password: String!): AuthPayload
mutation signOut: Boolean

# Conversations
mutation createConversation(participantIds: [String]): CreateConversationResponse
mutation markConversationAsRead(userId: String!, conversationId: String!): Boolean
mutation deleteConversation(conversationId: String!): Boolean
mutation updateParticipants(conversationId: String!, participantIds: [String]!): Boolean

# Messages
mutation sendMessage(conversationId: String, body: String): Boolean
```

### Subscriptions

```graphql
# Notified when a new conversation is created
subscription conversationCreated: Conversation

# Notified when a conversation is updated (participants added/removed)
subscription conversationUpdated: ConversationUpdatedSubscriptionPayload

# Notified when a conversation is deleted
subscription conversationDeleted: ConversationDeletedResponse

# Real‑time messages in a conversation
subscription messageSent(conversationId: String): Message
```
