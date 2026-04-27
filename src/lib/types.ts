export type ListingType = "nft" | "rmz" | "etoken" | "mintpass";

export type ListingStatus = "available" | "sold";

export interface ListingPrice {
  amount?: number;
  symbol: string;
}

export interface Listing {
  id: string;
  type: ListingType;
  collection: string;
  name: string;
  description: string;
  image: string;
  price: ListingPrice;
  offerId: string;
  status: ListingStatus;
  tonalliDeepLink: string;
  tonalliFallbackUrl: string;
  whatsappUrl?: string;
  source?: "demo" | "registry" | "walletconnect" | "tonalli";
  tokenId?: string;
  seller?: string;
  timestamp?: number;
  amount?: string;
  live?: boolean;
  topic?: string;
}

export interface CollectionInfo {
  id: string;
  name: string;
  description: string;
  supply: number;
  floor: string;
}
