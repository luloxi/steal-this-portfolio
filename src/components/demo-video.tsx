"use client";

import { useEffect, useRef } from "react";

/**
 * Short muted demo loop (public/demos/<name>.webm|mp4, poster <name>.webp).
 * Sources load only when the clip is near the viewport, and it pauses off-screen.
 * Under prefers-reduced-motion it never loads: the poster (a real screenshot) stays.
 */
export function DemoVideo({ name, label, className }: { name: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!v.dataset.loaded) {
            v.dataset.loaded = "1";
            v.querySelectorAll("source").forEach((s) => {
              if (s.dataset.src) s.src = s.dataset.src;
            });
            v.load();
          }
          void v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "160px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className ? `demo-video ${className}` : "demo-video"}
      poster={`/demos/${name}.webp`}
      width={960}
      height={600}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-label={label}
      title={label}
    >
      <source data-src={`/demos/${name}.webm`} type="video/webm" />
      <source data-src={`/demos/${name}.mp4`} type="video/mp4" />
    </video>
  );
}
