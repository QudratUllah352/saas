import Link from "next/link";
import OfferTiming from "./OfferTiming";
import { getOfferTime } from "@/lib/dealDates";

export default async function DealCard({ deal }) {
  const offerNow = await getOfferTime();
  const product = deal?.product || {};
  const category = product?.category?.name || "SaaS";

  return (
    <article className="premium-deal-card">
      <div className="premium-deal-top">
        <span className="premium-deal-category">
          {category}
        </span>

        <span className="premium-deal-discount">
          {deal?.discount || "Deal"}
        </span>
      </div>

      <div className="premium-deal-product">
        <div className="premium-deal-logo">
          {product?.logo ? (
            <img
              src={product.logo}
              alt={`${product.name || "Product"} logo`}
            />
          ) : (
            <span>
              {(product?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div className="premium-deal-product-info">
          <h3>{product?.name || "SaaS Product"}</h3>

          <p>
            {product?.shortDescription ||
              product?.description ||
              "Discover this SaaS product and its current deal."}
          </p>
        </div>
      </div>

      <div className="premium-deal-price">
        <div>
          <span className="premium-price-label">
            Deal price
          </span>

          <div className="premium-price-row">
            <strong>
              ${deal?.price ?? "—"}
            </strong>

            {deal?.oldPrice !== undefined &&
              deal?.oldPrice !== null && (
                <span>
                  ${deal.oldPrice}
                </span>
              )}
          </div>
        </div>

        <span className="premium-deal-type">
          {deal?.dealType || "special"}
        </span>
      </div>

      <OfferTiming deal={deal} initialNow={offerNow} />

      <Link
        href={`/deals/${deal?._id}`}
        className="premium-deal-button"
      >
        View Deal
        <span>→</span>
      </Link>
    </article>
  );
}
