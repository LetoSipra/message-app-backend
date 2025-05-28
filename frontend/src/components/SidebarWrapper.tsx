import { ConversationSchema } from "@/graphql/operations/conversations";
import Sidebar from "./Sidebar";
import { ConversationsData } from "@/typings";
import { query } from "@/graphql/apollo-client";

async function SidebarWrapper() {
  const { data } = await query<ConversationsData>({
    query: ConversationSchema.Queries.conversations,
  });
  return <Sidebar conversations={data.conversations} />;
}

export default SidebarWrapper;
