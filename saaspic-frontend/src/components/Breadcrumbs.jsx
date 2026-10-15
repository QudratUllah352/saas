import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";
import JsonLd from "./JsonLd";
import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs({ items }) {
  const origin = getSiteUrl();
  return <>
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol>{items.map((item, index) => <li key={item.path}>
        {index > 0 && <span aria-hidden="true"> / </span>}
        {index === items.length - 1
          ? <span aria-current="page">{item.name}</span>
          : <Link href={item.path}>{item.name}</Link>}
      </li>)}</ol>
    </nav>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem", position: index + 1,
        name: item.name, item: new URL(item.path, origin).href,
      })),
    }} />
  </>;
}
