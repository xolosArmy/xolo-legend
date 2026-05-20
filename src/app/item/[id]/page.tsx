import { notFound } from "next/navigation";
import { ListingDetails } from "@/components/ListingDetails";
import { loadRegistry, REGISTRY_REVALIDATE_SECONDS } from "@/lib/registry";

interface ItemPageProps {
  params: { id: string };
}

export const revalidate = REGISTRY_REVALIDATE_SECONDS;

export default async function ItemPage({ params }: ItemPageProps) {
  const listings = await loadRegistry();
  const listing = listings.find((entry) => entry.id === params.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="container py-8">
      <ListingDetails listing={listing} />
    </div>
  );
}
