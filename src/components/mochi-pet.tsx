"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Desk pet for a project whose widget is "pet". One 7-frame sheet. It walks
 * along the bottom of the screen, sometimes climbs a side wall up to about
 * half the height and drops back down. Click it: it sits with a laptop and
 * answers. Only the pet takes clicks. Reduced motion: it stays still and
 * still answers.
 */
const SHEET = "/projects/mochi-pet.webp";
const F = { stand: 0, walkL: 1, walkR: 2, pc: 3, pc1: 4, pc2: 5, sprawl: 6 } as const;
const COPY = {
  es: { say: "Estoy en mantenimiento, ¡volvé pronto!", close: "Cerrar", label: "Mascota, tocá para hablar" },
  en: { say: "I'm under maintenance, come back soon!", close: "Close", label: "Pet, tap to talk" },
};

type Mode = "walk" | "idle" | "climb" | "hang" | "fall" | "land" | "talk";

export function ProjectPet() {
  const { locale } = useLocale();
  const c = COPY[locale === "en" ? "en" : "es"];
  const petRef = useRef<HTMLButtonElement>(null);
  const spriteRef = useRef<HTMLSpanElement>(null);
  const [talking, setTalking] = useState(false);
  const [pos, setPos] = useState<{ x: number; size: number } | null>(null);
  const talkRef = useRef(false);
  const wantTalk = useRef(false);

  useEffect(() => {
    const pet = petRef.current;
    const sprite = spriteRef.current;
    if (!pet || !sprite) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const size = () => (window.innerWidth < 640 ? 64 : 84);
    let S = size();
    let W = window.innerWidth;
    let H = window.innerHeight;
    // x = left edge, y = height of the feet above the bottom edge.
    let x = reduce ? W - S - 16 : Math.random() * (W - S);
    let y = 0;
    let vy = 0;
    let dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    let mode: Mode = reduce ? "idle" : "walk";
    let wall: "left" | "right" | null = null;
    let target = 0;
    let until = 0;
    let frame: number = F.stand;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      let rot = 0;
      // The art faces left: mirror it when walking right.
      let flip = dir === 1 ? -1 : 1;
      let tx = x;
      const ty = -y;
      if (mode === "climb" || mode === "hang") {
        // Feet against the wall, head pointing away; climbing is "forward".
        rot = wall === "right" ? -90 : 90;
        // Face up the wall (art faces left; rotation is applied after the mirror).
        flip = wall === "right" ? -1 : 1;
        tx = wall === "right" ? W - S : 0;
      }
      if (mode === "fall") rot = Math.sin(now / 70) * 12;
      sprite.style.backgroundPosition = `${-frame * S}px 0`;
      sprite.style.transform = `rotate(${rot}deg) scaleX(${flip})`;
      pet.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const onResize = () => {
      S = size();
      W = window.innerWidth;
      H = window.innerHeight;
      x = Math.min(Math.max(0, x), W - S);
      pet.style.width = pet.style.height = `${S}px`;
      sprite.style.backgroundSize = `${S * 7}px ${S}px`;
      if (talkRef.current) setPos({ x, size: S });
      draw(performance.now());
    };
    onResize();

    const startTalk = () => {
      mode = "talk";
      setPos({ x, size: S });
      setTalking(true);
      talkRef.current = true;
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (document.visibilityState !== "visible") {
        raf = requestAnimationFrame(tick);
        return;
      }
      const step = Math.floor(now / 170) % 4; // stand, L, stand, R
      switch (mode) {
        case "walk": {
          if (wantTalk.current) { wantTalk.current = false; startTalk(); break; }
          frame = step === 1 ? F.walkL : step === 3 ? F.walkR : F.stand;
          x += dir * 46 * dt;
          if (x <= 0 || x >= W - S) {
            x = Math.min(Math.max(0, x), W - S);
            if (Math.random() < 0.55) {
              mode = "climb";
              wall = x <= 0 ? "left" : "right";
              target = H * (0.22 + Math.random() * 0.28);
            } else dir = dir === 1 ? -1 : 1;
          } else if (Math.random() < dt * 0.12) {
            mode = "idle";
            until = now + 1200 + Math.random() * 1800;
          }
          break;
        }
        case "idle":
          frame = F.stand;
          if (wantTalk.current) { wantTalk.current = false; startTalk(); break; }
          if (!reduce && now > until) {
            mode = "walk";
            if (Math.random() < 0.4) dir = dir === 1 ? -1 : 1;
          }
          break;
        case "climb":
          frame = step === 1 ? F.walkL : step === 3 ? F.walkR : F.stand;
          // While on the wall, x tracks the height climbed (drawn rotated).
          y += 30 * dt;
          if (wantTalk.current || y >= target) {
            mode = "hang";
            until = now + (wantTalk.current ? 0 : 700 + Math.random() * 900);
          }
          break;
        case "hang":
          frame = F.stand;
          if (now > until) {
            mode = "fall";
            vy = 0;
            x = wall === "right" ? W - S : 0;
            wall = null;
            dir = x <= 0 ? 1 : -1;
          }
          break;
        case "fall":
          frame = F.stand;
          vy += 1500 * dt;
          y -= vy * dt;
          if (y <= 0) {
            y = 0;
            mode = "land";
            until = now + 650;
          }
          break;
        case "land":
          frame = F.sprawl;
          if (now > until) {
            if (wantTalk.current) { wantTalk.current = false; startTalk(); }
            else mode = "walk";
          }
          break;
        case "talk":
          frame = Math.floor(now / 280) % 2 === 0 ? F.pc1 : F.pc2; // feet swinging
          if (!talkRef.current) {
            mode = "walk";
          }
          break;
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };

    if (reduce) {
      // Static: no loop. Clicks swap to the laptop pose directly.
      frame = F.stand;
      draw(last);
      const onTalk = () => {
        frame = talkRef.current ? F.pc : F.stand;
        draw(performance.now());
      };
      window.addEventListener("mochi-talk", onTalk);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("mochi-talk", onTalk);
        window.removeEventListener("resize", onResize);
      };
    }
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const open = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (talkRef.current) return;
    if (reduce) {
      const r = petRef.current?.getBoundingClientRect();
      setPos({ x: r?.left ?? 0, size: r?.width ?? 64 });
      talkRef.current = true;
      setTalking(true);
      window.dispatchEvent(new Event("mochi-talk"));
    } else wantTalk.current = true;
  };
  const close = () => {
    talkRef.current = false;
    setTalking(false);
    window.dispatchEvent(new Event("mochi-talk"));
    petRef.current?.focus();
  };
  useEffect(() => {
    if (!talking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      talkRef.current = false;
      setTalking(false);
      window.dispatchEvent(new Event("mochi-talk"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [talking]);

  const bubbleLeft = pos ? `clamp(8px, ${pos.x + pos.size / 2}px - 7.5rem, calc(100vw - 15rem - 8px))` : undefined;

  return (
    <div className="mochi-layer" aria-live="polite" data-inline-editor="skip">
      {talking && pos ? (
        <div className="mochi-bubble" role="dialog" aria-label={c.label} style={{ left: bubbleLeft, bottom: pos.size + 10 }}>
          <button type="button" className="mochi-bubble-close" onClick={close} aria-label={c.close}>
            ×
          </button>
          <p>{c.say}</p>
          <span className="mochi-bubble-tail" style={{ left: `clamp(14px, ${pos.x + pos.size / 2}px - (${bubbleLeft}), calc(15rem - 14px))` }} aria-hidden />
        </div>
      ) : null}
      <button
        ref={petRef}
        type="button"
        className={`mochi-pet${talking ? " is-talking" : ""}`}
        aria-label={c.label}
        aria-expanded={talking}
        onClick={open}
      >
        <span ref={spriteRef} className="mochi-sprite" style={{ backgroundImage: `url(${SHEET})` }} aria-hidden />
      </button>
    </div>
  );
}
