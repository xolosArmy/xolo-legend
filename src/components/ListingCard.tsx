"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Listing } from "@/lib/types";
import { acceptOfferById } from "@/lib/agora";
import { useFavorites, usePurchaseStatus, useTxid } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";
import { useOnChain } from "@/state/onchain";
import { RMZ_TOKEN_ID } from "@/lib/constants";
import { fetchTx } from "@/lib/chronik";
import {
  extractWalletConnectTxid,
  requestSignAndBroadcast
} from "@/lib/walletconnect";
import { setLastBuyDebug } from "@/lib/wcDebug";
import { useWallet } from "@/lib/wallet";
import { useWcOffers } from "@/state/wcOffersStore";

interface ListingCardProps {
  listing: Listing;
  isHighlighted?: boolean;
  onRemove?: () => void;
  onDismiss?: () => void;
}

export function ListingCard({
  listing,
  isHighlighted,
  onRemove,
  onDismiss
}: ListingCardProps) {
  const { favorites, toggleFavorite } = useFavorites();
  const { txid, setTxid } = useTxid(listing.id);
  const { purchaseStatus, setPurchaseStatus } = usePurchaseStatus(listing.offerId);
  const { showToast } = useToast();
  const { offerStatusCache, verifyOffer, configWarning } = useOnChain();
  const { session } = useWallet();
  const { markBought } = useWcOffers();
  const [txidInput, setTxidInput] = useState(txid);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const isPurchased = Boolean(txid);
  const isPending = purchaseStatus.state === "pending";
  const isBroadcasted = purchaseStatus.state === "broadcasted";
  const isConfirmed = purchaseStatus.state === "confirmed";
  const isErrored = purchaseStatus.state === "error";

  const isFavorite = favorites.includes(listing.id);
  const offerStatus = offerStatusCache[listing.offerId];
  const isInvalidOrSpent =
    offerStatus?.status === "invalid" ||
    offerStatus?.status === "spent" ||
    offerStatus?.status === "not_found";
  const isAvailable = offerStatus?.status === "available";
  const isChecking =
    offerStatus?.isChecking || offerStatus?.status === "unknown" || !offerStatus;
  const configBlocked = Boolean(configWarning) && listing.type === "rmz";
  const tonalliDisabled = !isAvailable || configBlocked;
  const tokenMismatch =
    listing.type === "rmz" &&
    offerStatus?.status === "available" &&
    Boolean(offerStatus.tokenId) &&
    Boolean(RMZ_TOKEN_ID) &&
    offerStatus.tokenId?.toLowerCase() !== RMZ_TOKEN_ID.toLowerCase();
  const termsStatus = offerStatus?.termsStatus;
  const onChainTerms = offerStatus?.terms;
  const isExternalImage = !listing.image.startsWith("/");
  const listingPriceAmount = listing.price.amount;
  const hasManualPrice =
    termsStatus === "manual" &&
    Number.isFinite(listingPriceAmount) &&
    (listingPriceAmount ?? 0) > 0;
  const hasListingPrice =
    Number.isFinite(listingPriceAmount) && (listingPriceAmount ?? 0) > 0;
  const displayPrice =
    termsStatus === "manual"
      ? hasManualPrice
        ? listing.price
        : undefined
      : listing.source === "registry" && offerStatus?.priceSats !== undefined
        ? { amount: offerStatus.priceSats, symbol: "sats" }
        : hasListingPrice
          ? listing.price
          : undefined;
  const displayPriceAmount = displayPrice?.amount;
  const tokenSymbol =
    listing.type === "rmz"
      ? "RMZ"
      : listing.type === "etoken"
        ? "ETOKEN"
        : listing.type === "mintpass"
          ? "PASS"
          : "TOKEN";
  const priceLabel = onChainTerms
    ? `${onChainTerms.xecTotal} XEC`
    : displayPrice && typeof displayPriceAmount === "number" && Number.isFinite(displayPriceAmount)
      ? `${displayPriceAmount.toLocaleString(undefined, {
          maximumFractionDigits: 2
        })} ${displayPrice.symbol}`
      : undefined;
  const priceDetail =
    onChainTerms?.kind === "token"
      ? `${onChainTerms.xecPerToken} XEC / ${tokenSymbol}`
      : undefined;
  const typeLabel =
    listing.type === "nft"
      ? "NFT"
      : listing.type === "mintpass"
        ? "MINT PASS"
        : listing.type === "etoken"
          ? "ETOKEN"
          : "RMZ";
  const tonalliKindBadge =
    listing.source === "tonalli" && listing.type !== "nft"
      ? listing.type === "rmz"
        ? "RMZ Offer"
        : listing.type === "etoken"
          ? "eToken Offer"
          : "Mint Pass Offer"
      : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(listing.offerId);
    showToast("Offer ID copiado.");
  };

  const handleBuy = async () => {
    if (isPending || isBroadcasted) {
      return;
    }
    if (!listing.offerId) {
      showToast("Oferta inválida.");
      return;
    }
    if (!session || session.type !== "walletconnect") {
      showToast("Conecta RMZWallet para comprar.");
      return;
    }
    try {
      setPurchaseStatus({ state: "pending" });
      showToast("Esperando firma en RMZWallet...");
      const chainId = "ecash:mainnet";
      const topic = session.topic;
      const timeoutMs = 120000;
      const maxAttempts = 2;
      const buildRequestId = () => Math.floor(Date.now() + Math.random() * 1000);
      const getErrorMessage = (error: unknown) =>
        error instanceof Error && error.message ? error.message : String(error ?? "");
      let response: unknown = null;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const expiryTimestamp = nowSeconds + 120;
        const ttlSecondsRaw = expiryTimestamp
          ? expiryTimestamp - nowSeconds
          : 300;
        const ttlSeconds = Math.min(604800, Math.max(300, ttlSecondsRaw));
        const requestId = buildRequestId();
        console.debug(
          "[XoloLegend][BUY] request offerId=",
          listing.offerId,
          "expiryTimestamp=",
          expiryTimestamp,
          "nowSeconds=",
          nowSeconds,
          "ttlSeconds=",
          ttlSeconds,
          "topic=",
          topic,
          "chainId=",
          chainId,
          "requestId=",
          requestId,
          "attempt=",
          attempt
        );
        setLastBuyDebug({
          at: Date.now(),
          status: "request",
          offerId: listing.offerId,
          expiryTimestamp,
          ttlSeconds,
          nowSeconds,
          topic,
          chainId,
          requestId
        });
        try {
          response = await requestSignAndBroadcast({
            topic,
            offerId: listing.offerId,
            timeoutMs,
            ttlSeconds,
            requestId
          });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          const message = getErrorMessage(error);
          console.debug("[XoloLegend][BUY] request error=", message);
          if (message.includes("Request expired") && attempt < maxAttempts) {
            showToast("Expiró la solicitud, vuelve a intentar.");
            continue;
          }
          break;
        }
      }

      if (lastError) {
        const rawMessage = getErrorMessage(lastError);
        const message = rawMessage.includes("Request expired")
          ? "Expiró la solicitud, vuelve a intentar."
          : rawMessage || "No se pudo completar la compra.";
        console.debug(
          "[XoloLegend][BUY] failed offerId=",
          listing.offerId,
          "error=",
          message
        );
        setPurchaseStatus({ state: "error", error: message });
        setLastBuyDebug({
          at: Date.now(),
          status: "error",
          offerId: listing.offerId,
          error: message,
          topic,
          chainId
        });
        showToast(message);
        return;
      }
      console.debug("[XoloLegend][BUY] response=", response);
      const nextTxid = extractWalletConnectTxid(response);
      if (!nextTxid) {
        console.debug(
          "[XoloLegend][BUY] invalid txid offerId=",
          listing.offerId,
          "response=",
          response
        );
        setPurchaseStatus({
          state: "error",
          error: "No se recibió un TXID válido desde RMZWallet."
        });
        setLastBuyDebug({
          at: Date.now(),
          status: "error",
          offerId: listing.offerId,
          error: "No se recibió un TXID válido desde RMZWallet."
        });
        showToast("No se recibió un TXID válido desde RMZWallet.");
        return;
      }
      console.debug("[XoloLegend][BUY] txid=", nextTxid, "offerId=", listing.offerId);
      if (listing.source === "tonalli") {
        markBought(listing.offerId, nextTxid);
      }
      setPurchaseStatus({ state: "broadcasted", txid: nextTxid });
      setLastBuyDebug({
        at: Date.now(),
        status: "broadcasted",
        offerId: listing.offerId,
        txid: nextTxid
      });
      showToast("TXID recibido.");

      const confirmed = await confirmTxid(nextTxid);
      if (confirmed) {
        setPurchaseStatus({ state: "confirmed", txid: nextTxid });
        setLastBuyDebug({
          at: Date.now(),
          status: "confirmed",
          offerId: listing.offerId,
          txid: nextTxid
        });
        setTxid(nextTxid);
        showToast("Compra confirmada.");
      } else {
        showToast("No se pudo confirmar el TX todavía. Revisa en unos segundos.");
      }
    } catch (error) {
      console.debug("[XoloLegend][BUY] error=", error);
      const rawMessage =
        error instanceof Error && error.message ? error.message : "";
      const message = rawMessage.includes("Request expired")
        ? "Expiró la solicitud, vuelve a intentar."
        : rawMessage || "No se pudo completar la compra.";
      setPurchaseStatus({ state: "error", error: message });
      setLastBuyDebug({
        at: Date.now(),
        status: "error",
        offerId: listing.offerId,
        error: message,
        topic: session.topic,
        chainId: "ecash:mainnet"
      });
      showToast(message);
    }
  };

  const confirmTxid = async (txidToCheck: string) => {
    const attempts = 4;
    const delayMs = 3500;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await fetchTx(txidToCheck);
        return true;
      } catch {
        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (!listing.offerId) {
      return;
    }
    const timer = window.setTimeout(() => {
      verifyOffer(listing.offerId);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [listing.offerId, verifyOffer]);

  useEffect(() => {
    if (isModalOpen) {
      setTxidInput(txid);
    }
  }, [isModalOpen, txid]);

  const handleSaveTxid = () => {
    setTxid(txidInput.trim());
    showToast("TXID guardado.");
    setIsModalOpen(false);
  };

  const badgeLabel = isChecking
    ? "🟡 Checking…"
    : isInvalidOrSpent
      ? offerStatus?.status === "spent"
        ? "⚠️ Spent"
        : offerStatus?.status === "not_found"
          ? "⚠️ Not found"
          : "⚠️ Invalid"
      : "✅ Available";
  const badgeClasses = isChecking
    ? "border-white/10 text-white/60 bg-obsidian-950/70"
    : isInvalidOrSpent
      ? "border-gold/40 text-gold bg-gold/10"
      : "border-jade/40 text-jade bg-jade/10";
  const purchaseBadge =
    isPending || isBroadcasted
      ? {
          label: "Compra en proceso",
          classes: "border-amber-300/40 text-amber-100 bg-amber-300/10"
        }
      : isErrored
        ? {
            label: "Error de compra",
            classes: "border-rose-400/40 text-rose-200 bg-rose-400/10"
          }
      : null;

  return (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border border-white/10 bg-obsidian-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-jade/50 hover:shadow-glow ${
        isHighlighted ? "ring-2 ring-jade/60" : ""
      }`}
    >
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {onRemove ? (
          <div className="relative">
            <button
              onClick={() => setIsManageOpen((prev) => !prev)}
              aria-label="Manage listing"
              className="rounded-full border border-white/10 px-2.5 py-2 text-xs text-white/60 transition hover:border-jade/40 hover:text-jade"
            >
              ⋯
            </button>
            {isManageOpen ? (
              <div className="absolute right-0 top-10 w-40 rounded-xl border border-white/10 bg-obsidian-950/95 p-2 text-xs text-white/70 shadow-glow">
                <button
                  onClick={() => {
                    onRemove();
                    setIsManageOpen(false);
                  }}
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-gold transition hover:border-gold/60 hover:text-gold"
                >
                  Remove listing
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {onDismiss ? (
          <button
            onClick={onDismiss}
            aria-label="Dismiss live offer"
            className="rounded-full border border-amber-400/40 bg-obsidian-950/80 px-2.5 py-2 text-xs text-amber-200 transition hover:border-amber-300 hover:text-amber-100"
          >
            x
          </button>
        ) : null}
        <button
          onClick={() => toggleFavorite(listing.id)}
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={`rounded-full border px-2.5 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade ${
            isFavorite
              ? "border-jade/60 bg-jade/10 text-jade"
              : "border-white/10 text-white/60 hover:border-jade/40 hover:text-jade"
          }`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
        {isExternalImage ? (
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        )}
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-obsidian-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
          {typeLabel}
        </div>
        {listing.source === "registry" ? (
          <div className="absolute right-3 bottom-3 rounded-full border border-white/10 bg-obsidian-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
            User listing
          </div>
        ) : null}
        {listing.source === "tonalli" ? (
          <div className="absolute right-3 bottom-3 rounded-full border border-amber-400/40 bg-obsidian-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
            Tonalli
          </div>
        ) : null}
        {listing.live ? (
          <div className="absolute right-3 top-12 rounded-full border border-amber-300/40 bg-obsidian-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-100">
            LIVE FROM TONALLI
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-jade/30 bg-obsidian-950/70 px-3 py-2 text-xs text-jade">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
          Offer ID (txid:vout)
        </span>
        <span className="mt-1 block break-all font-mono text-[11px] text-white/80">
          {listing.offerId}
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] ${badgeClasses}`}>
            {badgeLabel}
          </span>
          {purchaseBadge ? (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] ${purchaseBadge.classes}`}
            >
              {purchaseBadge.label}
            </span>
          ) : null}
          {onChainTerms ? (
            <>
              <span className="text-[10px] text-white/60">
                On-chain: {onChainTerms.xecTotal} XEC
              </span>
              {onChainTerms.kind === "token" ? (
                <span className="text-[10px] text-white/60">
                  Amount: {onChainTerms.tokenAmount} {tokenSymbol}
                </span>
              ) : null}
            </>
          ) : offerStatus?.priceSats !== undefined && termsStatus !== "manual" ? (
            <span className="text-[10px] text-white/60">
              On-chain: {offerStatus.priceSats.toLocaleString()} sats
            </span>
          ) : null}
          {!onChainTerms && offerStatus?.amountAtoms && termsStatus !== "manual" ? (
            <span className="text-[10px] text-white/60">
              Amount: {offerStatus.amountAtoms} atoms
            </span>
          ) : null}
        </div>
      </div>
      {tonalliKindBadge ? (
        <div className="mt-2 inline-flex w-fit items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-100">
          {tonalliKindBadge}
        </div>
      ) : null}

      {listing.source === "tonalli" ? (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-obsidian-950/70 px-3 py-2 text-[11px] text-amber-100">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-white/40">Price</span>
            <span className="text-white/80">
              {Number.isFinite(listingPriceAmount) ? `${listingPriceAmount} XEC` : "—"}
            </span>
          </div>
          {listing.amount ? (
            <div className="mt-2 flex flex-wrap justify-between gap-2">
              <span className="text-white/40">Amount</span>
              <span className="font-mono text-white/80">{listing.amount}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-white/40">Token ID</span>
            <span className="font-mono text-white/80">{listing.tokenId || "—"}</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2">
            <span className="text-white/40">Seller</span>
            <span className="font-mono text-white/80">{listing.seller || "—"}</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2">
            <span className="text-white/40">Timestamp</span>
            <span className="text-white/80">
              {listing.timestamp ? new Date(listing.timestamp).toLocaleString() : "—"}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-white">{listing.name}</h3>
        <p
          className="mt-2 overflow-hidden text-sm text-white/70"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {listing.description}
        </p>
        {priceLabel ? (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Precio</span>
              <span className="text-base font-semibold text-gold">{priceLabel}</span>
            </div>
            {priceDetail ? (
              <p className="mt-1 text-xs text-white/60">{priceDetail}</p>
            ) : null}
            {termsStatus === "manual" && hasManualPrice ? (
              <p className="mt-1 text-xs text-white/50">Seller-declared price</p>
            ) : null}
          </div>
        ) : listing.source === "registry" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Precio</span>
              <span className="text-base font-semibold text-gold">Precio en la oferta</span>
            </div>
            <p className="mt-1 text-xs text-white/60">Ver oferta en Tonalli para confirmar.</p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copy Offer ID"
            className="rounded-xl border border-white/10 bg-obsidian-950/80 px-3 py-2 text-xs text-white/80 transition hover:border-jade/50 hover:text-jade"
          >
            Copy Offer ID
          </button>
          <button
            onClick={handleBuy}
            disabled={
              !session ||
              session.type !== "walletconnect" ||
              isPending ||
              isBroadcasted ||
              isConfirmed ||
              isPurchased
            }
            className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-center text-xs text-gold transition hover:border-gold hover:bg-gold/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
          >
            {isPending
              ? "Esperando firma..."
              : isBroadcasted
                ? "Compra en proceso"
                : isErrored
                  ? "Reintentar compra"
                : isConfirmed || isPurchased
                  ? "Comprado"
                  : session?.type === "walletconnect"
                    ? "Comprar (RMZWallet)"
                    : "Comprar"}
          </button>
          <button
            onClick={() =>
              acceptOfferById({
                offerId: listing.offerId,
                deepLink: listing.tonalliDeepLink,
                fallbackUrl: listing.tonalliFallbackUrl
              })
            }
            disabled={tonalliDisabled}
            className="col-span-2 rounded-xl border border-jade/40 bg-jade/10 px-3 py-2 text-center text-xs text-jade shadow-glow transition hover:border-jade hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
          >
            Open in Tonalli
          </button>
        </div>
        {(isBroadcasted || isConfirmed) && purchaseStatus.txid ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-obsidian-950/70 px-3 py-2 text-[11px] text-white/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-white/40">TXID</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(purchaseStatus.txid ?? "");
                  showToast("TXID copiado.");
                }}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/70 transition hover:border-jade/40 hover:text-jade"
              >
                Copy
              </button>
            </div>
            <span className="mt-1 block break-all font-mono text-[11px] text-white/80">
              {purchaseStatus.txid}
            </span>
          </div>
        ) : null}
        {isErrored && purchaseStatus.error ? (
          <div className="mt-3 rounded-xl border border-rose-400/30 bg-obsidian-950/70 px-3 py-2 text-[11px] text-rose-200">
            {purchaseStatus.error}
          </div>
        ) : null}
        {configBlocked ? (
          <p className="mt-3 text-xs text-gold">
            Config missing: set env vars to enable RMZ offers.
          </p>
        ) : null}
        {isInvalidOrSpent ? (
          <p className="mt-3 text-xs text-gold">
            Offer unavailable: missing, invalid, or explicitly spent.
          </p>
        ) : null}
        {tokenMismatch ? (
          <p className="mt-3 text-xs text-gold">
            This offer tokenId does not match RMZ.
          </p>
        ) : null}
        {isPurchased ? (
          <p className="mt-3 text-xs text-jade">Compra registrada.</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/60">
          <Link className="underline decoration-white/30 underline-offset-4" href="/how-to-buy">
            ¿Cómo pagar?
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="underline decoration-white/30 underline-offset-4"
          >
            Ya compré → pegar TXID
          </button>
        </div>

        {listing.whatsappUrl ? (
          <a
            href={listing.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold transition hover:border-gold hover:bg-gold/20"
          >
            Contacta con el vendedor
          </a>
        ) : null}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Pegar TXID"
        description="Guarda la confirmación de tu compra para seguimiento."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="space-y-4">
          <input
            value={txidInput}
            onChange={(event) => setTxidInput(event.target.value)}
            placeholder="Ingresa tu TXID"
            className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTxid}
              className="rounded-xl border border-jade/40 bg-jade/10 px-4 py-2 text-xs text-jade transition hover:bg-jade/20"
            >
              Guardar TXID
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
