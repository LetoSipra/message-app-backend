import { query } from "@/graphql/apollo-client";
import ConversationList from "./ConversationList";
import SidebarHeader from "./SidebarHeader";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { ConversationsData } from "@/typings";

async function Sidebar() {
  const { data } = await query<ConversationsData>({
    query: ConversationSchema.Queries.conversations,
  });
  return (
    <div className="flex-col flex w-full space-y-5 justify-between my-6">
      <SidebarHeader />
      <div className="border-b-2 border-[#27272A] mx-5" />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ConversationList conversations={data.conversations} />
      </div>
    </div>
  );
}

export default Sidebar;
