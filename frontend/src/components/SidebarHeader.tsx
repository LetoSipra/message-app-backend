"use client";
import { signOutAction } from "@/app/(auth)/(actions)/signOut";
import { useState } from "react";
import Modal from "./Modal";
import { useLazyQuery, useMutation } from "@apollo/client";
import { UserSchema } from "@/graphql/operations/user";
import {
  CreateConversationData,
  SearchedUser,
  SearchUsersData,
  SearchUsersInputs,
} from "@/typings";
import { X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { toast } from "sonner";
function SidebarHeader() {
  const { user } = useUser();
  const [modalState, setModalState] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([]);
  const [input, setInput] = useState("");

  const [searchUsers, { data, loading, error }] = useLazyQuery<
    SearchUsersData,
    SearchUsersInputs
  >(UserSchema.Queries.searchUsers);

  const [createConversation, { loading: createConversationLoading }] =
    useMutation<CreateConversationData, { participantIds: string[] }>(
      ConversationSchema.Mutations.createConversation
    );

  //const client = useApolloClient();
  const handleUserSearch = () => {
    searchUsers({
      variables: {
        username: input,
      },
    });
  };
  // const clearSearchData = async () => {
  //   client.resetStore();
  // };
  const handleCreateConversation = () => {
    if (!user) return;
    const IDs = [user?.id, ...selectedUsers.map((user) => user.id)];

    try {
      toast.promise(
        createConversation({
          variables: {
            participantIds: IDs,
          },
        }),
        {
          loading: "Loading...",
          success: `Conversation created`,
          error: (err) => err.message,
        }
      );
    } catch (error) {
      console.log("error", error);
    }
  };
  return (
    <>
      <Modal
        isOpen={modalState}
        onClose={() => {
          setModalState(false);
          setSelectedUsers([]);
          setInput("");
        }}
      >
        <div className="border-[#27272A] border-2 space-y-2 p-5 rounded-xl">
          <h1 className="text-xl mb-5">Create a Conversation</h1>
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
                            return selectedUsers.filter(
                              (u) => u.id !== user.id
                            );
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
              <h1 className="text-lg mb-3">Selected users</h1>
              <div className="flex flex-wrap gap-2">
                {selectedUsers?.map((user) => {
                  return (
                    <button
                      onClick={() =>
                        setSelectedUsers((prev) => {
                          if (prev.find((u) => u.id === user.id)) {
                            return selectedUsers.filter(
                              (u) => u.id !== user.id
                            );
                          }
                          return [...prev];
                        })
                      }
                      key={user.id}
                      className="px-3 py-1 cursor-pointer bg-[#fafafa] text-[#0a0a0b] rounded flex transition-opacity duration-200 hover:opacity-75"
                    >
                      <X />
                      {user.username}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={createConversationLoading}
                onClick={() => handleCreateConversation()}
                className="flex mt-5 cursor-pointer w-full justify-center space-x-2 rounded-md  bg-[#fafafa] text-[#0a0a0b] py-2 transition-opacity duration-200 hover:opacity-75"
              >
                {createConversationLoading
                  ? "Loading..."
                  : "Create Conversation"}
              </button>
            </>
          )}
        </div>
      </Modal>
      <div className="flex space-x-10 mx-5 justify-center items-center">
        <button
          onClick={() => setModalState(true)}
          className="flex cursor-pointer w-full h-10 items-center justify-center space-x-2 rounded bg-[#fafafa] text-[#0a0a0b] transition-opacity duration-200 hover:opacity-75"
        >
          Start conversations
        </button>
        <button
          className="flex cursor-pointer w-full h-10 items-center justify-center space-x-2 rounded bg-[#fafafa] text-[#0a0a0b] transition-opacity duration-200 hover:opacity-75"
          onClick={async () => {
            await signOutAction();
          }}
        >
          Sign Out
        </button>
      </div>
    </>
  );
}

export default SidebarHeader;
