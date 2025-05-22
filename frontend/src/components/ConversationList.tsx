"use client";

import { formatTimestamp } from "@/functions";
import { ConversationSchema } from "@/graphql/operations/conversations";
import {
  ConversationCreatedSubscriptionData,
  ConversationPopulated,
} from "@/typings";
import { useSubscription } from "@apollo/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ConversationList({
  conversations,
}: {
  conversations: ConversationPopulated[];
}) {
  const { data } = useSubscription<ConversationCreatedSubscriptionData>(
    ConversationSchema.Subscriptions.conversationCreated
  );
  const [convos, setConvos] = useState<ConversationPopulated[]>(conversations);
  const { data: updateData } = useSubscription(
    ConversationSchema.Subscriptions.conversationUpdated
  );

  useEffect(() => {
    if (!updateData?.conversationUpdated) return;

    const { conversation: updatedConv } = updateData.conversationUpdated;

    setConvos((prev) => {
      // Remove any existing copy of this conversation
      const others = prev.filter((c) => c.id !== updatedConv.id);

      // Put the updated conversation at the front
      return [updatedConv, ...others];
    });
  }, [updateData]);

  useEffect(() => {
    if (!data?.conversationCreated) return;
    const newConvo = data.conversationCreated;
    toast.success("New chat created");
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
              <p className="text-[#696970] h-7 overflow-hidden whitespace-nowrap truncate">
                {conversation.latestMessage
                  ? conversation.latestMessage.body
                  : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default ConversationList;
