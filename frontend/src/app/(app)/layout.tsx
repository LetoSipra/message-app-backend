import Sidebar from "@/components/Sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen mx-40">
      <aside className="w-1/4 flex">
        <Sidebar />
        <div className="border-r-1 border-r-[#27272A]" />
      </aside>
      <main className="flex w-full">{children}</main>
    </div>
  );
}
