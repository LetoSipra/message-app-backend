import Messages from "@/components/Messages";

interface Props {
  params: {
    slug: string;
  };
}

async function Page({ params }: Props) {
  const { slug } = await params;

  return <Messages slug={slug} />;
}

export default Page;
