"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Listing } from "@/lib/types";
import { Tabs } from "@/components/Tabs";
import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { useFavorites } from "@/lib/storage";
import { useOnChain } from "@/state/onchain";
import { removeListing, type RegistryListing } from "@/lib/registry";
import { RMZ_TOKEN_ID, TONALLI_WEB_URL } from "@/lib/constants";
import {
  setTokenMeta,
  setTokenMetaStatus,
  useWcOffers
} from "@/state/wcOffersStore";
import { fetchToken } from "@/lib/chronik";
import { useToast } from "@/components/ToastProvider";
import { spentOutpointTracker } from "@/lib/SpentOutpointTracker";

const tabs = [
  { id: "nft", label: "NFTs" },
  { id: "rmz", label: "RMZ Token" },
  { id: "etoken", label: "eToken" },
  { id: "mintpass", label: "Mint Pass" },
  { id: "favorites", label: "Favoritos" }
];

const validListingTypes = new Set<Listing["type"]>([
  "nft",
  "rmz",
  "etoken",
  "mintpass"
]);

function normalizeListingType(type?: string) {
  return type && validListingTypes.has(type as Listing["type"])
    ? (type as Listing["type"])
    : ("nft" as const);
}

const isLikelyImageUrl = (value?: string) =>
  Boolean(
    value &&
      /^https?:\/\//i.test(value) &&
      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value)
  );

interface MarketplaceClientProps {
  listings: RegistryListing[];
}

export function MarketplaceClient({ listings }: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get("collection") ?? "";
  const highlightId = searchParams.get("highlight") ?? "";
  const { favorites } = useFavorites();
  const { offerStatusCache, verifyOffer } = useOnChain();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("nft");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [sort, setSort] = useState("newest");
  const [showDemo, setShowDemo] = useState(false);
  const [registryListings, setRegistryListings] = useState<RegistryListing[]>(listings);
  const { offers: liveOffers, tokenMeta, tokenMetaStatus, dismissOffer } = useWcOffers();
  const trackedOutpointsRef = useRef(new Set<string>());

  useEffect(() => {
    if (initialCollection) {
      setCollection(initialCollection);
    }
  }, [initialCollection]);

  useEffect(() => {
    setRegistryListings(listings);
  }, [listings]);


  const initialTabRef = useRef(true);

  useEffect(() => {
    if (initialTabRef.current) {
      initialTabRef.current = false;
      return;
    }
    setCollection("");
  }, [activeTab]);

  const registryDisplayListings = useMemo(
    () =>
      registryListings.map((listing) => ({
        ...listing,
        type:
          listing.tokenId &&
          Boolean(RMZ_TOKEN_ID) &&
          listing.tokenId.toLowerCase() === RMZ_TOKEN_ID.toLowerCase()
            ? "rmz"
            : normalizeListingType(listing.type),
        offerId: listing.offerId || listing.offerTxId || "",
        tonalliFallbackUrl: listing.tonalliFallbackUrl || TONALLI_WEB_URL,
        source: "registry" as const
      })),
    [registryListings]
  );

  const liveListings = useMemo(() => {
    return liveOffers
      .filter((offer) => !offer.dismissed && offer.status !== "bought")
      .map((offer) => {
        const meta = offer.tokenId ? tokenMeta[offer.tokenId] : undefined;
        const metaName = meta?.name ?? meta?.ticker;
        const fallbackName = offer.tokenId
          ? `Tonalli ${
              offer.kind === "rmz"
                ? "RMZ"
                : offer.kind === "etoken"
                  ? "eToken"
                  : offer.kind === "mintpass"
                    ? "Mint Pass"
                    : "NFT"
            } ${offer.tokenId.slice(0, 6)}`
          : "Tonalli Live Offer";
        const image =
          meta?.image ??
          (isLikelyImageUrl(meta?.url) ? meta?.url : undefined) ??
          "/placeholders/nft-1.svg";
        const listingType =
          offer.kind === "rmz"
            ? ("rmz" as const)
            : offer.kind === "etoken"
              ? ("etoken" as const)
              : offer.kind === "mintpass"
                ? ("mintpass" as const)
                : ("nft" as const);

        return {
          id: `wc-${offer.topic}-${offer.offerId}`,
          type: listingType,
          collection:
            offer.kind === "mintpass"
              ? "Mint Pass"
              : offer.kind === "etoken"
                ? "eToken"
                : "Tonalli Live",
          name: metaName ? `${metaName}` : fallbackName,
          description: "Offer published from Tonalli",
          image,
          price: { amount: offer.priceXec ?? 0, symbol: "XEC" },
          offerId: offer.offerId,
          status: "available" as const,
          tonalliDeepLink: `tonalli://offer/${offer.offerId}`,
          tonalliFallbackUrl: TONALLI_WEB_URL,
          source: "tonalli" as const,
          tokenId: offer.tokenId,
          seller: offer.seller,
          timestamp: offer.timestamp,
          amount: offer.amount,
          live: true,
          topic: offer.topic
        };
      });
  }, [liveOffers, tokenMeta]);

  useEffect(() => {
    liveOffers.forEach((offer) => {
      const tokenId = offer.tokenId;
      if (!tokenId) return;
      const status = tokenMetaStatus[tokenId];
      if (status === "loading" || status === "loaded") return;
      setTokenMetaStatus(tokenId, "loading");
      fetchToken(tokenId)
        .then(async (info) => {
          const baseMeta = {
            tokenId,
            name: info.tokenName ?? undefined,
            ticker: info.tokenTicker ?? undefined,
            url: info.url ?? undefined
          } as const;

          if (info.url && /^https?:\/\//i.test(info.url)) {
            if (isLikelyImageUrl(info.url)) {
              setTokenMeta(tokenId, { ...baseMeta, image: info.url });
              return;
            }
            try {
              const response = await fetch(info.url, { method: "GET" });
              const contentType = response.headers.get("content-type") ?? "";
              if (response.ok && contentType.includes("application/json")) {
                const json = (await response.json()) as {
                  name?: unknown;
                  title?: unknown;
                  image?: unknown;
                };
                const name =
                  typeof json.name === "string"
                    ? json.name
                    : typeof json.title === "string"
                      ? json.title
                      : baseMeta.name ?? baseMeta.ticker;
                const image =
                  typeof json.image === "string" ? json.image : undefined;
                setTokenMeta(tokenId, { ...baseMeta, name, image });
                return;
              }
              if (response.ok && contentType.startsWith("image/")) {
                setTokenMeta(tokenId, { ...baseMeta, image: info.url });
                return;
              }
            } catch {
              // ignore metadata fetch failures
            }
          }

          setTokenMeta(tokenId, { ...baseMeta });
        })
        .catch(() => {
          setTokenMetaStatus(tokenId, "error");
        });
    });
  }, [liveOffers, tokenMetaStatus]);

  useEffect(() => {
    const next = new Set(
      liveOffers.map((offer) => offer.offerId).filter(Boolean)
    );
    const prev = trackedOutpointsRef.current;
    next.forEach((offerId) => {
      if (!prev.has(offerId)) {
        spentOutpointTracker.register(offerId);
      }
    });
    prev.forEach((offerId) => {
      if (!next.has(offerId)) {
        spentOutpointTracker.unregister(offerId);
      }
    });
    trackedOutpointsRef.current = next;
  }, [liveOffers]);

  useEffect(() => {
    return () => {
      trackedOutpointsRef.current.forEach((offerId) => {
        spentOutpointTracker.unregister(offerId);
      });
      trackedOutpointsRef.current = new Set();
    };
  }, []);

  const combinedListings = useMemo<Listing[]>(() => {
    return registryDisplayListings;
  }, [registryDisplayListings]);

  const wcCountRef = useRef(liveListings.length);
  const wcMountedRef = useRef(false);

  useEffect(() => {
    if (!wcMountedRef.current) {
      wcMountedRef.current = true;
      wcCountRef.current = liveListings.length;
      return;
    }
    if (liveListings.length > wcCountRef.current) {
      showToast("Nueva oferta desde Tonalli.");
    }
    wcCountRef.current = liveListings.length;
  }, [showToast, liveListings.length]);

  useEffect(() => {
    const unique = new Set(
      [...liveListings, ...combinedListings]
        .map((listing) => listing.offerId)
        .filter(Boolean)
    );
    unique.forEach((offerId) => {
      verifyOffer(offerId);
    });
  }, [combinedListings, liveListings, verifyOffer]);

  const collections = useMemo(() => {
    const scoped = [...combinedListings, ...liveListings].filter((listing) =>
      activeTab === "favorites"
        ? true
        : normalizeListingType(listing.type) === activeTab
    );
    const unique = new Set(scoped.map((listing) => listing.collection));
    return Array.from(unique);
  }, [activeTab, combinedListings, liveListings]);

  const isListingVerified = useCallback(
    (listing: Listing) => {
      const status = offerStatusCache[listing.offerId];
      return status?.status === "available";
    },
    [offerStatusCache]
  );

  const isRegistryDisplayable = useCallback(
    (listing: Listing) => {
      if (listing.source !== "registry") {
        return isListingVerified(listing);
      }

      const status = offerStatusCache[listing.offerId];
      if (status?.status === "available") {
        return true;
      }
      if (
        status?.status === "spent" ||
        status?.status === "invalid" ||
        status?.status === "not_found"
      ) {
        return false;
      }

      const registryListing = listing as RegistryListing;
      return (
        Boolean(listing.offerId) &&
        (!registryListing.verification ||
          registryListing.verification === "available" ||
          registryListing.verification === "unknown")
      );
    },
    [isListingVerified, offerStatusCache]
  );

  // Filter + sort entirely client-side for fast iteration.
  const filteredListings = useMemo(() => {
    const lowered = search.toLowerCase();
    let next = combinedListings.filter((listing) => {
      const listingType = normalizeListingType(listing.type);
      if (activeTab === "favorites" && !favorites.includes(listing.id)) {
        return false;
      }
      if (activeTab !== "favorites" && listingType !== activeTab) {
        return false;
      }
      if (!showDemo && !isRegistryDisplayable(listing)) {
        return false;
      }
      if (collection && listing.collection !== collection) {
        return false;
      }
      if (!lowered) return true;
      return (
        listing.name.toLowerCase().includes(lowered) ||
        listing.collection.toLowerCase().includes(lowered) ||
        listing.offerId.toLowerCase().includes(lowered)
      );
    });

    if (sort === "price-asc") {
      next = [...next].sort((a, b) => (a.price.amount ?? 0) - (b.price.amount ?? 0));
    }
    if (sort === "price-desc") {
      next = [...next].sort((a, b) => (b.price.amount ?? 0) - (a.price.amount ?? 0));
    }

    return next;
  }, [
    activeTab,
    collection,
    favorites,
    combinedListings,
    search,
    sort,
    showDemo,
    isRegistryDisplayable
  ]);

  const filteredLiveListings = useMemo(() => {
    const lowered = search.toLowerCase();
    return liveListings.filter((listing) => {
      if (activeTab === "favorites") {
        return false;
      }
      if (listing.type !== activeTab) {
        return false;
      }
      if (collection && listing.collection !== collection) {
        return false;
      }
      if (!lowered) return true;
      return (
        listing.name.toLowerCase().includes(lowered) ||
        listing.collection.toLowerCase().includes(lowered) ||
        listing.offerId.toLowerCase().includes(lowered)
      );
    });
  }, [activeTab, collection, liveListings, search]);

  const displayListings = useMemo(() => {
    const liveIds = new Set(filteredLiveListings.map((listing) => listing.id));
    const filteredWithoutLive = filteredListings.filter(
      (listing) => !liveIds.has(listing.id)
    );
    return [...filteredLiveListings, ...filteredWithoutLive];
  }, [filteredListings, filteredLiveListings]);

  const hasVerifiedListings = useMemo(() => {
    return [...liveListings, ...combinedListings].some((listing) =>
      isRegistryDisplayable(listing)
    );
  }, [combinedListings, isRegistryDisplayable, liveListings]);

  const handleRemove = useCallback((id: string) => {
    const next = removeListing(id);
    setRegistryListings(next);
  }, []);

  const handleClear = () => {
    setSearch("");
    setCollection("");
    setSort("newest");
  };

  return (
    <section className="space-y-6">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={search}
        collection={collection}
        sort={sort}
        collections={collections}
        showDemo={showDemo}
        onSearchChange={setSearch}
        onCollectionChange={setCollection}
        onSortChange={setSort}
        onShowDemoChange={setShowDemo}
        onClear={handleClear}
      />
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{displayListings.length} resultados</span>
        {collection ? <span>Filtrado por {collection}</span> : null}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isHighlighted={highlightId === listing.id}
            onRemove={listing.source === "registry" ? () => handleRemove(listing.id) : undefined}
            onDismiss={
              listing.source === "tonalli"
                ? () => dismissOffer(listing.offerId, listing.topic)
                : undefined
            }
          />
        ))}
      </div>
      {!showDemo && !hasVerifiedListings ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian-900/50 p-6 text-center text-white/60">
          No hay ofertas disponibles aún.
          <div className="mt-4">
            <a
              href="/create"
              className="inline-flex items-center rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm text-jade shadow-glow transition hover:bg-jade/20"
            >
              Create a real listing
            </a>
          </div>
        </div>
      ) : null}
      {displayListings.length === 0 && (showDemo || hasVerifiedListings) ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian-900/50 p-6 text-center text-white/60">
          No encontramos ofertas con esos filtros.
        </div>
      ) : null}
    </section>
  );
}
