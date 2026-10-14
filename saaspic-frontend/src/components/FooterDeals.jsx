"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import styles from "./FooterDeals.module.css";

export default function FooterDeals({ categories }) {
  const id = useId();
  const panel = useRef(null);
  const [open, setOpen] = useState(false);

  function positionDropdown(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dropdown = panel.current;
    const width = Math.min(260, window.innerWidth - 32);
    dropdown.style.width = `${width}px`;
    dropdown.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))}px`;
    dropdown.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    dropdown.style.maxHeight = `${Math.max(80, rect.top - 24)}px`;
  }

  function closeDropdown() {
    panel.current?.hidePopover();
  }

  return (
    <div className={styles.control}>
      <Link href="/deals" onClick={closeDropdown}>Deals</Link>
      <button
        type="button"
        className={styles.toggle}
        popoverTarget={id}
        popoverTargetAction="toggle"
        aria-label={open ? "Hide deal categories" : "Show deal categories"}
        aria-expanded={open}
        aria-controls={id}
        onClick={positionDropdown}
      >
        <svg className={open ? styles.rotated : undefined} width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Native popovers use the top layer, avoiding the footer's overflow clipping.
          They also provide outside-click/Escape dismissal and normal Tab navigation. */}
      <div
        ref={panel}
        id={id}
        popover="auto"
        className={styles.dropdown}
        onToggle={(event) => setOpen(event.newState === "open")}
      >
        <nav aria-label="Footer deal categories">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} onClick={closeDropdown}>
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
