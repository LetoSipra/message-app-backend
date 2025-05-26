import Messages from "@/components/Messages";

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <Messages slug={slug} />;
}

export default Page;
