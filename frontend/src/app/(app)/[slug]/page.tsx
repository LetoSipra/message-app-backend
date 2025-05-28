import ConversationBody from "@/components/ConversationBody";

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <ConversationBody slug={slug} />;
}

export default Page;
