"use client";

import { useState } from "react";

export default function ReviewShare({
    title,
    slug,
    siteUrl,
}) {
    const [copied, setCopied] = useState(false);

    const reviewUrl =
        `${siteUrl}/reviews/${encodeURIComponent(slug)}`;

    const encodedUrl =
        encodeURIComponent(reviewUrl);

    const encodedTitle =
        encodeURIComponent(title || "");

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(
                reviewUrl
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <div className="review-share">

            <span>SHARE THIS REVIEW</span>

            <div className="review-share-buttons">

                <a
                    href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Share on X
                </a>

                <a
                    href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Reddit
                </a>

                <button
                    type="button"
                    onClick={copyLink}
                >
                    {copied ? "Copied!" : "Copy Link"}
                </button>

            </div>

        </div>
    );
}