"use client";
import ConversationList from "./ConversationList";
import SidebarHeader from "./SidebarHeader";
import { ConversationsData } from "@/typings";
import { usePathname } from "next/navigation";

function Sidebar(conversationData: ConversationsData) {
  const path = usePathname();

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
          {conversationData && (
            <ConversationList conversations={conversationData.conversations} />
          )}
        </div>
      </div>
      <div className="border-r-1 border-r-[#27272A] hidden md:flex" />
    </aside>
  );
}

export default Sidebar;
