type MessagePopulated = {
  sender: {
    id: string;
    username: string;
  };
} & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
  senderId: string;
  body: string;
};

export interface ConversationParticipantPopulated {
  user: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  conversation: ConversationPopulated;
}

export interface ConversationParticipants {
  participants: ConversationParticipantPopulated[];
}

export interface ConversationPopulated {
  id: string;
  participants: ConversationParticipantPopulated[];
  latestMessage: {
    body: string;
    createdAt: number;
    id: true;
    sender: {
      id: string;
      username: string;
    };
  };
  updatedAt: number;
}

/**
 * Users
 */
export interface CreateUsernameVariables {
  username: string;
}

export interface CreateUsernameData {
  createUsername: {
    success: boolean;
    error: string;
  };
}

export interface SearchUsersInputs {
  username: string;
}

export interface GetCurrentUser {
  getCurrentUser: SearchedUser;
}

export interface SearchUsersData {
  searchUsers: Array<SearchedUser>;
}

export interface SearchedUser {
  id: string;
  username: string;
}

/**
 * Messages
 */
export interface MessagesData {
  messages: Array<MessagePopulated>;
}

export interface MessagesVariables {
  conversationId: string;
}

export interface ConversationDeleteVariables {
  conversationId: string;
}

export interface SendMessageVariables {
  conversationId: string;
  body: string;
}

export interface MessagesSubscriptionData {
  messageSent: MessagePopulated;
}

/**
 * Conversations
 */
export interface CreateConversationData {
  createConversation: {
    conversationId: string;
  };
}

export interface ConversationsData {
  conversations: Array<ConversationPopulated>;
}

export interface ConversationCreatedSubscriptionData {
  conversationCreated: ConversationPopulated;
}

export interface ConversationUpdatedData {
  conversationUpdated: {
    conversation: Omit<ConversationPopulated, "latestMessage"> & {
      latestMessage: MessagePopulated;
    };
    addedUserIds: Array<string> | null;
    removedUserIds: Array<string> | null;
  };
}

export interface ConversationDeletedData {
  conversationDeleted: {
    id: string;
  };
}
