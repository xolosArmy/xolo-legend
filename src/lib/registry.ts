import type { Listing, ListingType } from "@/lib/types";

const DEFAULT_REGISTRY_URL = "https://api.xolosarmy.xyz/listings";
export const REGISTRY_REVALIDATE_SECONDS = 3600;

type RegistryVerification =
  | "available"
  | "spent"
  | "invalid"
  | "not_found"
  | "unknown";

export type RegistryListing = Listing & {
  createdAt: number;
  title: string;
  description: string;
  collection: string;
  imageUrl?: string;
  offerTxId?: string;
  priceSats?: string;
  amountAtoms?: string;
  verification?: RegistryVerification;
};

export type RegistryListingInput = {
  id: string;
  createdAt: number;
  title: string;
  description?: string;
  collection?: string;
  imageUrl?: string;
  offerTxId?: string;
  offerId?: string;
  tokenId?: string;
  priceSats?: string;
  amountAtoms?: string;
  verification?: RegistryVerification;
};

type RegistryApiRecord = Partial<RegistryListingInput> & {
  ID?: unknown;
  offertxid?: unknown;
  image?: unknown;
};

function normalizeRegistryUrl(url?: string) {
  const trimmed = url?.trim();
  if (!trimmed) {
    return DEFAULT_REGISTRY_URL;
  }
  return /\/listings\/?$/i.test(trimmed)
    ? trimmed.replace(/\/+$/, "")
    : `${trimmed.replace(/\/+$/, "")}/listings`;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalString(value: unknown) {
  const next = asString(value);
  return next ? next : undefined;
}

function normalizeVerification(value: unknown): RegistryVerification | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  switch (value) {
    case "available":
    case "spent":
    case "invalid":
    case "not_found":
    case "unknown":
      return value;
    default:
      return "unknown";
  }
}

function inferListingType(tokenId?: string): ListingType {
  return tokenId ? "rmz" : "nft";
}

function normalizePriceAmount(priceSats?: string) {
  if (!priceSats) {
    return undefined;
  }
  const numeric = Number(priceSats);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function buildRegistryListing(item: RegistryApiRecord): RegistryListing {
  const id = asString(item.id) || asString(item.ID);
  const title = asString(item.title) || "XOLOLEGEND Listing";
  const description = toOptionalString(item.description) ?? "User listing";
  const collection = toOptionalString(item.collection) ?? "User Listings";
  const imageUrl =
    toOptionalString(item.imageUrl) ??
    toOptionalString(item.image) ??
    "/placeholders/nft-1.svg";
  const offerTxId = toOptionalString(item.offerTxId) ?? toOptionalString(item.offertxid);
  const offerId = toOptionalString(item.offerId) ?? offerTxId ?? "";
  const tokenId = toOptionalString(item.tokenId);
  const priceSats = toOptionalString(item.priceSats);
  const verification = normalizeVerification(item.verification) ?? "unknown";
  const createdAt =
    typeof item.createdAt === "number" && Number.isFinite(item.createdAt)
      ? item.createdAt
      : Date.now();
  const listingType = inferListingType(tokenId);
  const priceAmount = normalizePriceAmount(priceSats);

  return {
    id,
    createdAt,
    title,
    description,
    collection,
    imageUrl,
    offerTxId,
    offerId,
    tokenId,
    priceSats,
    amountAtoms: toOptionalString(item.amountAtoms),
    verification,
    type: listingType,
    name: title,
    image: imageUrl,
    price: { amount: priceAmount, symbol: "sats" },
    status:
      verification === "spent" || verification === "invalid" || verification === "not_found"
        ? "sold"
        : "available",
    tonalliDeepLink: offerId ? `tonalli://offer/${offerId}` : "tonalli://offer/",
    tonalliFallbackUrl: "https://tonalli.app/",
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`Estoy interesado en ${title}`)}`,
    source: "registry"
  };
}

function getRegistryUrl() {
  return normalizeRegistryUrl(process.env.NEXT_PUBLIC_API_URL);
}

/**
 * Indica que el sistema es global
 */
export function isRegistryPersistent() {
  return true;
}

/**
 * Carga los listados globales
 */
export async function loadRegistry(): Promise<RegistryListing[]> {
  try {
    const response = await fetch(getRegistryUrl(), {
      next: { revalidate: REGISTRY_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error("Error en servidor");
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => buildRegistryListing((item ?? {}) as RegistryApiRecord));
  } catch (error) {
    console.error("Error cargando registro:", error);
    return [];
  }
}

/**
 * Publica un listado al VPS de Hostinger
 */
export async function saveRegistryListing(listing: RegistryListingInput): Promise<void> {
  try {
    const response = await fetch(getRegistryUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    if (!response.ok) throw new Error("Error al guardar en el servidor");
  } catch (error) {
    console.error("Error de red al publicar:", error);
    throw error;
  }
}

export async function addListing(listing: RegistryListingInput): Promise<void> {
  await saveRegistryListing(listing);
}

/**
 * Funciones de mantenimiento (Requieren implementación de DELETE/PUT en el backend)
 */
export function removeListing(id: string): RegistryListing[] {
  console.warn(
    "La eliminación global requiere implementar el método DELETE en el backend."
  );
  return [];
}

export function updateListing(id: string, patch: Partial<RegistryListing>) {
  console.warn(
    "La actualización global requiere implementar el método PUT en el backend."
  );
}
