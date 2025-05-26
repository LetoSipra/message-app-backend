"use client";
import { MessageSchema } from "@/graphql/operations/messages";
import { useUser } from "@/hooks/useUser";
import {
  Conversation,
  ConversationDeletedData,
  ConversationDeleteVariables,
  MessagesData,
  MessagesSubscriptionData,
  MessagesVariables,
  SearchedUser,
  SendMessageVariables,
} from "@/typings";
import { useMutation, useQuery } from "@apollo/client";
import { EllipsisVertical, Send, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import UpdateModal from "./UpdateModal";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { toast } from "sonner";
import Link from "next/link";
import { formatTimestamp } from "@/lib/formatTimestamp";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
}

function Messages({ slug }: Props) {
  const { user } = useUser();
  const [modalState, setModalState] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([]);
  const [sendMessageInput, setSendMessageInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const [deleteConversation, { loading }] = useMutation<
    ConversationDeletedData,
    ConversationDeleteVariables
  >(ConversationSchema.Mutations.deleteConversation, {
    variables: {
      conversationId: slug,
    },
  });

  const handleConversationDelete = () => {
    try {
      toast.promise(
        deleteConversation({
          variables: {
            conversationId: slug,
          },
        }),
        {
          loading: "Loading...",
          success: () => {
            router.push("/");
            return "Conversation deleted";
          },
          error: (err) => err.message,
        }
      );
    } catch (error) {
      console.log("error", error);
    }
  };

  const { subscribeToMore, data } = useQuery<MessagesData, MessagesVariables>(
    MessageSchema.Query.messages,
    {
      variables: {
        conversationId: slug,
      },
    }
  );
  const { data: conversationData } = useQuery<Conversation>(
    ConversationSchema.Queries.conversation,
    {
      variables: {
        conversationId: slug,
      },
    }
  );

  const [sendMessage, { loading: sendMessageLoading }] = useMutation<
    unknown,
    SendMessageVariables
  >(MessageSchema.Mutations.sendMessage);

  // Refs for scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (data?.messages?.length && bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [data?.messages.length]);

  useEffect(() => {
    if (data) {
      const unsubscribe = subscribeToMore<MessagesSubscriptionData>({
        document: MessageSchema.Subscriptions.messageSent,
        variables: { conversationId: slug },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data?.messageSent) return prev;
          const newMessage = subscriptionData.data.messageSent;

          return Object.assign({}, prev, {
            messages: [...prev.messages, newMessage],
          });
        },
      });

      return () => {
        unsubscribe();
      };
    }
  }, [data, subscribeToMore, slug]);

  const handleSendMessage = () => {
    if (!user?.id) return;
    if (sendMessageInput.length < 0) return;

    const trimmedStart = sendMessageInput.replace(/^\s+/, "");

    if (/^\s*$/.test(trimmedStart)) {
      return;
    }

    const sanitized = trimmedStart.replace(/\s{3,}/g, "  ");

    try {
      sendMessage({
        variables: {
          conversationId: slug,
          body: sanitized,
        },
      }).then((f) => {
        if (f.data) {
          setSendMessageInput("");
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Refs for dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex-1 justify-between flex flex-col m-5 space-y-2">
      {modalState && (
        <UpdateModal
          modalState={modalState}
          selectedUsers={selectedUsers}
          setModalState={setModalState}
          setSelectedUsers={setSelectedUsers}
          conversationId={slug}
        />
      )}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 flex-wrap">
          <h1>From:</h1>
          {conversationData?.conversation.participants.map((participant) => (
            <p className="font-bold" key={participant.user.id}>
              {participant.user.username}
            </p>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 rounded-full cursor-pointer hover:bg-[#fafafa]/10 transition"
            >
              <EllipsisVertical size={24} />
            </button>
            {showMenu && (
              <div className="absolute top-full left-1/2 mt-1 w-48 -translate-x-1/2 bg-[#27272A] border border-[#27272A] rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    const getParticipants =
                      conversationData?.conversation.participants.map((p) => ({
                        id: p.user.id,
                        username: p.user.username,
                      }));
                    if (getParticipants !== undefined) {
                      setSelectedUsers(getParticipants);
                    }
                    setModalState(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left cursor-pointer px-4 py-2 hover:bg-[#fafafa]/10 transition"
                >
                  Update Conversation
                </button>
                <button
                  onClick={() => {
                    handleConversationDelete();
                    setShowMenu(false);
                  }}
                  disabled={loading}
                  className="w-full text-left cursor-pointer px-4 py-2 hover:bg-[#fafafa]/10 transition text-red-500"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <Link
            href={"/"}
            className="p-2 transition-opacity duration-200 hover:opacity-75 hover:bg-[#fafafa]/10 rounded-full"
          >
            <X size={24} />
          </Link>
        </div>
      </div>
      <div className="border border-[#27272A]" />
      <div
        ref={containerRef}
        className="flex-1 my-2 space-y-5 overflow-y-auto scrollbar-thin"
      >
        {data?.messages.map((message) => (
          <div
            key={message.id}
            className={`space-y-1 hover:bg-[white]/5 flex flex-col ${
              message.sender.id === user?.id ? "items-end" : "items-start"
            } transition-all delay-100 p-2 rounded-md`}
          >
            <h1 className="font-bold">{message.sender.username}</h1>
            <div className="bg-[#27272A] max-w-sm w-fit p-3 rounded-md">
              <p className="break-words">{message.body}</p>
            </div>
            <p className="text-[#696970]">
              {formatTimestamp(message.createdAt)}
            </p>
          </div>
        ))}
        <div ref={bottomAnchorRef} />
      </div>
      <div className="w-full flex justify-between items-center space-x-2">
        <input
          placeholder="Type a message"
          type="text"
          disabled={sendMessageLoading}
          value={sendMessageInput}
          onChange={(e) => setSendMessageInput(e.target.value)}
          className="border-2 w-full placeholder:text-[white] rounded-sm focus:outline-white focus:outline p-1.5 border-[#27272A]"
        />
        <button
          disabled={sendMessageLoading}
          onClick={() => handleSendMessage()}
          className="flex cursor-pointer space-x-1 w-28 items-center justify-center rounded-md  bg-[#fafafa] text-[#0a0a0b] p-2 transition-opacity duration-200 hover:opacity-75"
        >
          {sendMessageLoading ? (
            "Loading..."
          ) : (
            <>
              <p>Send</p>
              <Send />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Messages;
