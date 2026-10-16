import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";
import JsonLd from "./JsonLd";
import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs({ items, standalone = false, blog = false, structuredData = true }) {
  const origin = structuredData ? getSiteUrl() : null;
  return <>
    <nav aria-label="Breadcrumb" className={[styles.breadcrumbs, standalone && styles.standalone, blog && styles.blog].filter(Boolean).join(" ")}>
      <ol role="list">{items.map((item, index) => <li key={item.path}>
        {index > 0 && <span className={styles.separator} aria-hidden="true">›</span>}
        {index === items.length - 1
          ? <span className={styles.current} aria-current="page">{item.name}</span>
          : <Link href={item.path}>{item.name}</Link>}
      </li>)}</ol>
    </nav>
    {structuredData && <JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem", position: index + 1,
        name: item.name, item: new URL(item.path, origin).href,
      })),
    }} />}
  </>;
}
