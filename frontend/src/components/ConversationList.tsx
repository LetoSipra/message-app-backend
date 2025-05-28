"use client";

import { formatTimestamp } from "@/lib/formatTimestamp";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { useUser } from "@/hooks/useUser";
import {
  ConversationCreatedSubscriptionData,
  ConversationDeletedData,
  ConversationMarkAsReadVariables,
  ConversationPopulated,
} from "@/typings";
import { useMutation, useSubscription } from "@apollo/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function ConversationList({
  conversations,
}: {
  conversations: ConversationPopulated[];
}) {
  const { user } = useUser();
  const { data } = useSubscription<ConversationCreatedSubscriptionData>(
    ConversationSchema.Subscriptions.conversationCreated
  );
  const [convos, setConvos] = useState<ConversationPopulated[]>(conversations);
  const { data: updateData } = useSubscription(
    ConversationSchema.Subscriptions.conversationUpdated
  );
  const { data: deleteData } = useSubscription<ConversationDeletedData>(
    ConversationSchema.Subscriptions.conversationDeleted
  );

  const [markConversationAsRead, {}] = useMutation<
    _Blob,
    ConversationMarkAsReadVariables
  >(ConversationSchema.Mutations.markConversationAsRead);

  const currentPath = usePathname();

  const handleMarkConversationAsRead = useCallback(
    (conversationId: string) => {
      if (!user) return;
      try {
        markConversationAsRead({
          variables: {
            conversationId,
            userId: user.id,
          },
        });
      } catch (error) {
        console.log(error);
      }
    },
    [user, markConversationAsRead]
  );

  useEffect(() => {
    if (!updateData?.conversationUpdated) return;

    const { conversation: updatedConv } = updateData.conversationUpdated;
    const currentConvId = currentPath.startsWith("/")
      ? currentPath.substring(1)
      : currentPath;

    if (updatedConv.id === currentConvId && user) {
      handleMarkConversationAsRead(currentConvId);
    }

    setConvos((prev) => {
      const others = prev.filter((c) => c.id !== updatedConv.id);

      return [updatedConv, ...others];
    });
  }, [updateData, currentPath, handleMarkConversationAsRead, user]);

  useEffect(() => {
    if (!deleteData?.conversationDeleted) return;
    const { id: deletedConversationId } = deleteData.conversationDeleted;
    setConvos((prev) => prev.filter((c) => c.id !== deletedConversationId));
  }, [deleteData]);

  useEffect(() => {
    if (!data?.conversationCreated) return;
    const newConvo = data.conversationCreated;
    setConvos((prev) => {
      if (prev.some((c) => c.id === newConvo.id)) {
        return prev;
      }
      const updated = [newConvo, ...prev];
      return updated;
    });
  }, [data]);

  return (
    <div className="flex-1 mx-3 space-y-5">
      {convos.map((conversation) => {
        const allNames = conversation.participants
          .map((p) => p.user.username)
          .join(", ");

        return (
          <Link
            onClick={() => handleMarkConversationAsRead(conversation.id)}
            key={conversation.id}
            href={conversation.id}
            className="space-y-2 flex flex-col"
          >
            <div className="flex flex-col p-2 border-[#27272A] border rounded-md cursor-pointer transition hover:bg-[#27272A] duration-200 min-w-0">
              {/* Participants row with single-line truncation */}
              <div className="flex justify-between space-x-2 space-y-2">
                <p className="font-bold truncate overflow-hidden whitespace-nowrap">
                  {allNames}
                </p>
                <p className="flex shrink-0">
                  {formatTimestamp(conversation.updatedAt)}
                </p>
              </div>
              {/* Latest message line */}
              <div className="text-[#696970] h-10">
                {conversation.latestMessage && (
                  <div className="flex items-center space-x-2">
                    {conversation.participants.map((p) => {
                      if (
                        (p.user.id === user?.id &&
                          !p.hasSeenLatestMessage &&
                          conversation.id !== currentPath.substring(1)) ||
                        ""
                      ) {
                        return (
                          <div
                            key={p.user.id}
                            className="w-3 h-3 bg-white rounded-full shrink-0"
                          />
                        );
                      }
                      return null;
                    })}
                    <p className="truncate">
                      {conversation.latestMessage.body}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default ConversationList;
