"use client";

import { useState } from "react";

export default function BlogShare({
    title,
    slug,
}) {
    const [copied, setCopied] = useState(false);

    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";

    const blogUrl = `${siteUrl}/blogs/${slug}`;

    const encodedUrl =
        encodeURIComponent(blogUrl);

    const encodedTitle =
        encodeURIComponent(title || "");

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(
                blogUrl
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
        <div className="blog-share">
            <span>SHARE THIS ARTICLE</span>

            <div className="blog-share-buttons">

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
                    {copied
                        ? "Copied!"
                        : "Copy Link"}
                </button>

            </div>
        </div>
    );
}