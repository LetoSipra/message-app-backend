"use client";
import { Dispatch, SetStateAction, useState } from "react";
import Modal from "./Modal";
import { useLazyQuery, useMutation } from "@apollo/client";
import { UserSchema } from "@/graphql/operations/user";
import {
  ConversationUpdatedData,
  SearchedUser,
  SearchUsersData,
  SearchUsersInputs,
} from "@/typings";
import { X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { toast } from "sonner";

interface Props {
  modalState: boolean;
  setModalState: Dispatch<SetStateAction<boolean>>;
  selectedUsers: SearchedUser[];
  setSelectedUsers: Dispatch<SetStateAction<SearchedUser[]>>;
  conversationId: string;
}

function UpdateModal({
  modalState,
  selectedUsers,
  setModalState,
  setSelectedUsers,
  conversationId,
}: Props) {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const [searchUsers, { data, loading, error }] = useLazyQuery<
    SearchUsersData,
    SearchUsersInputs
  >(UserSchema.Queries.searchUsers);

  const [updateConversation, { loading: updateConversationLoading }] =
    useMutation<
      ConversationUpdatedData,
      { conversationId: string; participantIds: string[] }
    >(ConversationSchema.Mutations.updateParticipants);

  const handleUserSearch = () => {
    searchUsers({
      variables: {
        username: input,
      },
    });
  };

  const handleUpdateConversation = () => {
    if (!user) return;
    const IDs = [user?.id, ...selectedUsers.map((user) => user.id)];

    try {
      toast.promise(
        updateConversation({
          variables: {
            participantIds: IDs,
            conversationId: conversationId,
          },
        }),
        {
          loading: "Loading...",
          success: `Conversation updated`,
          error: (err) => err.message,
        }
      );
    } catch (error) {
      console.log("error", error);
    }
  };
  return (
    <Modal
      isOpen={modalState}
      onClose={() => {
        setModalState(false);
        setSelectedUsers([]);
        setInput("");
      }}
    >
      <div className="border-[#27272A] border-2 space-y-2 p-5 rounded-xl">
        <h1 className="text-xl mb-5">Update Conversation</h1>
        <input
          type="text"
          minLength={3}
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search user's by username"
          className="border w-full rounded-sm focus:outline-white focus:outline p-1.5 "
        />
        <span className="text-lg text-red-400">{error?.message}</span>
        <button
          disabled={loading}
          onClick={() => handleUserSearch()}
          className="flex mt-2 cursor-pointer w-full justify-center space-x-2 rounded-md  bg-[#fafafa] text-[#0a0a0b] py-2 transition-opacity duration-200 hover:opacity-75"
        >
          {loading ? "Loading..." : "Search"}
        </button>
        <div className="flex gap-2 overflow-y-auto max-h-60 p-2 flex-col scrollbar-thin">
          {data?.searchUsers.map((user) => {
            return (
              <div key={user.id} className="px-3 py-1 break-words">
                <div className="flex justify-between items-center">
                  <p>{user.username}</p>
                  <button
                    //disabled={loading}
                    onClick={() => {
                      setSelectedUsers((prev) => {
                        // prevent adding the same user twice
                        if (prev.find((u) => u.id === user.id)) {
                          return selectedUsers.filter((u) => u.id !== user.id);
                        }
                        return [...prev, user];
                      });
                    }}
                    className="p-2 cursor-pointer justify-center rounded-md  bg-[#fafafa] text-[#0a0a0b] transition-opacity duration-200 hover:opacity-75"
                  >
                    {selectedUsers.find((u) => u.id === user.id)
                      ? "Delete"
                      : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {selectedUsers.length >= 1 && (
          <>
            {selectedUsers.length >= 1 && (
              <div className="">
                <h1 className="text-lg mb-3">Selected users</h1>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto scrollbar-thin">
                  {selectedUsers.map((user) => (
                    <button
                      onClick={() =>
                        setSelectedUsers((prev) =>
                          prev.filter((u) => u.id !== user.id)
                        )
                      }
                      key={user.id}
                      className="px-3 py-1 cursor-pointer bg-[#fafafa] text-[#0a0a0b] rounded flex items-center space-x-1 transition-opacity duration-200 hover:opacity-75"
                    >
                      <X />
                      <span>{user.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={updateConversationLoading}
              onClick={() => handleUpdateConversation()}
              className="flex mt-5 cursor-pointer w-full justify-center space-x-2 rounded-md  bg-[#fafafa] text-[#0a0a0b] py-2 transition-opacity duration-200 hover:opacity-75"
            >
              {updateConversationLoading ? "Loading..." : "Update Conversation"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

export default UpdateModal;
