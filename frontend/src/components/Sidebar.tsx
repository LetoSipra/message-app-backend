"use client";
import ConversationList from "./ConversationList";
import SidebarHeader from "./SidebarHeader";
import { ConversationSchema } from "@/graphql/operations/conversations";
import { ConversationsData } from "@/typings";
import { useQuery } from "@apollo/client";
import { usePathname } from "next/navigation";

function Sidebar() {
  const path = usePathname();
  const { data } = useQuery<ConversationsData>(
    ConversationSchema.Queries.conversations
  );
  return (
    <aside
      className={`shrink-0 ${
        path === "/" ? "w-full md:flex md:w-1/4" : "hidden md:flex md:w-1/4"
      } `}
    >
      <div className="flex-col flex w-full space-y-5 justify-between my-6">
        <SidebarHeader />
        <div className="border-b-2 border-[#27272A] mx-5" />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {data && <ConversationList conversations={data.conversations} />}
        </div>
      </div>
      <div className="border-r-1 border-r-[#27272A] hidden md:flex" />
    </aside>
  );
}

export default Sidebar;
