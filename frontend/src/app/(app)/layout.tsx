import Sidebar from "@/components/Sidebar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen xl:mx-40">
      <Sidebar />
      <main className="flex w-full">{children}</main>
    </div>
  );
}
