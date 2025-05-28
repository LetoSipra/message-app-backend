import SidebarWrapper from "@/components/SidebarWrapper";
import { Suspense } from "react";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="flex animate-pulse bg-black h-screen rounded-xl w-full justify-center items-center">
          Loading...
        </div>
      }
    >
      <div className="flex h-screen xl:mx-40">
        <SidebarWrapper />
        <main className="flex w-full">{children}</main>
      </div>
    </Suspense>
  );
}
