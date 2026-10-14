import { API_URL } from "@/lib/api";

export default function AffiliateButton({
    product,
    dealUrl = "",
    source = "other",
    label = "Visit Website",
    className = "",
}) {
    if (!product) {
        return null;
    }

    const affiliateEnabled =
        product.affiliate?.enabled === true;

    const destination = affiliateEnabled
        ? `${API_URL}/affiliate/go/${product._id}?source=${encodeURIComponent(
            source
        )}`
        : dealUrl || product.website;

    if (!destination) {
        return null;
    }

    return (
        <div className="affiliate-cta-wrapper">
            <a
                href={destination}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={`affiliate-cta-button ${className}`}
            >
                <span>{label}</span>

                <span className="affiliate-cta-arrow">
                    →
                </span>
            </a>

            {affiliateEnabled && (
                <p className="affiliate-cta-disclosure">
                    <span>ⓘ</span>

                    {product.affiliate?.disclosureText ||
                        "This is an affiliate link. SaaSpin may earn a commission if you purchase through this link, at no additional cost to you."}
                </p>
            )}
        </div>
    );
}