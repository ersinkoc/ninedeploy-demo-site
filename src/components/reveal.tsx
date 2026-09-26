"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll ile gelen yumuşak açılış. JS yoksa içerik görünür kalır
 * (`.bp-reveal` yalnızca `prefers-reduced-motion: no-preference` içinde gizler).
 */
export function Reveal({
  as: Tag = "div",
  delay,
  className = "",
  children,
}: {
  readonly as?: "div" | "li" | "section" | "article";
  readonly delay?: 1 | 2 | 3 | 4;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${armed && !shown ? "bp-reveal" : armed && shown ? "bp-reveal is-in" : ""} ${
        shown && delay ? `bp-d${delay}` : ""
      } ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
