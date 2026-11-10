"use client";

import { useEffect, useRef, useState } from "react";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

const WALK = ["stand-neutral", "walk-step-left", "stand-neutral", "walk-step-right"] as const;
const TALK = ["sit-pc-edge-legs-down", "sit-pc-edge-dangle-frame-1", "sit-pc-edge-legs-down", "sit-pc-edge-dangle-frame-2"] as const;

type Mode = "walk" | "idle" | "climb" | "hang" | "fall" | "land" | "talk";
type Line = { role: "mochi" | "user"; text: string };

/**
 * Mochi walks the way the portfolio pet does: along the bottom, sometimes up a
 * wall, then a fall and a sprawl. The art faces left, so going right mirrors it
 * (scaleX -1), same as the project pet and the Mochi desktop runtime.
 * Walk cycle: stand-neutral, walk-step-left, stand-neutral, walk-step-right.
 */
export function Mochi() {
  const { ask, state } = useDesk();
  const { locale } = useLocale();
  const en = locale === "en";
  const petRef = useRef<HTMLButtonElement>(null);
  const spriteRef = useRef<HTMLImageElement>(null);
  const wantTalk = useRef(false);
  const talkRef = useRef(false);
  const goalRef = useRef<number | null>(null);
  const [talking, setTalking] = useState(false);
  const [pos, setPos] = useState({ x: 24, size: 84 });
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>([
    {
      role: "mochi",
      text: en
        ? "I'm Mochi. I can open windows, read what's inside and move tasks."
        : "Soy Mochi. Puedo abrir ventanas, leer lo que hay adentro y mover tareas.",
    },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nudge = state.nudge;
    if (!nudge) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || talkRef.current) return;
    const el = document.querySelector(`[data-win="${nudge.app}"]`);
    const r = el?.getBoundingClientRect();
    if (!r) return;
    const size = window.innerWidth < 800 ? 64 : 84;
    goalRef.current = Math.min(Math.max(0, r.left + r.width / 2 - size / 2), window.innerWidth - size);
  }, [state.nudge]);

  useEffect(() => {
    const pet = petRef.current;
    const sprite = spriteRef.current;
    if (!pet || !sprite) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const sizeOf = () => (window.innerWidth < 800 ? 64 : 84);
    let S = sizeOf();
    let W = window.innerWidth;
    let H = window.innerHeight;
    let x = reduce ? W - S - 16 : Math.min(W - S - 24, Math.max(16, W * 0.35));
    let y = 0;
    let vy = 0;
    let dir: 1 | -1 = 1;
    let mode: Mode = reduce ? "idle" : "walk";
    let wall: "left" | "right" | null = null;
    let target = 0;
    let until = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      let rot = 0;
      let flip = dir === 1 ? -1 : 1;
      let tx = x;
      const ty = -y;
      let frame: string = WALK[Math.floor(now / 170) % 4];
      if (mode === "climb" || mode === "hang") {
        rot = wall === "right" ? -90 : 90;
        flip = wall === "right" ? -1 : 1;
        tx = wall === "right" ? W - S : 0;
        frame = mode === "hang" ? "stand-neutral" : WALK[Math.floor(now / 170) % 4];
      } else if (mode === "fall") {
        frame = "stand-neutral";
        rot = Math.sin(now / 70) * 12;
      } else if (mode === "land") {
        frame = "sprawl-lying";
        flip = 1;
      } else if (mode === "talk") {
        frame = TALK[Math.floor(now / 280) % 4];
        flip = 1;
      } else if (mode === "idle") {
        frame = "stand-neutral";
      }
      if (sprite.dataset.frame !== frame) {
        sprite.dataset.frame = frame;
        sprite.src = `/mochi/${frame}.png`;
      }
      sprite.style.transform = `rotate(${rot}deg) scaleX(${flip})`;
      pet.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const resize = () => {
      S = sizeOf();
      W = window.innerWidth;
      H = window.innerHeight;
      x = Math.min(Math.max(0, x), W - S);
      pet.style.width = `${S}px`;
      pet.style.height = `${S}px`;
      if (talkRef.current) setPos({ x, size: S });
      draw(performance.now());
    };
    resize();

    const startTalk = () => {
      mode = "talk";
      talkRef.current = true;
      setPos({ x, size: S });
      setTalking(true);
    };

    if (reduce) {
      const frameStill = () => {
        sprite.src = `/mochi/${talkRef.current ? "sit-pc-edge-legs-down" : "stand-neutral"}.png`;
        pet.style.transform = `translate3d(${x}px, 0, 0)`;
      };
      frameStill();
      const onTalk = () => {
        if (talkRef.current) startTalk();
        else {
          mode = "idle";
          draw(performance.now());
        }
      };
      window.addEventListener("resize", resize);
      const id = window.setInterval(onTalk, 400);
      return () => {
        window.clearInterval(id);
        window.removeEventListener("resize", resize);
      };
    }

    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (document.visibilityState !== "visible") {
        raf = requestAnimationFrame(tick);
        return;
      }
      switch (mode) {
        case "walk": {
          if (wantTalk.current) {
            wantTalk.current = false;
            startTalk();
            break;
          }
          if (goalRef.current != null) {
            const goal = goalRef.current;
            if (Math.abs(goal - x) < 8) goalRef.current = null;
            else dir = goal > x ? 1 : -1;
          }
          x += dir * 46 * dt;
          if (x <= 0 || x >= W - S) {
            x = Math.min(Math.max(0, x), W - S);
            if (goalRef.current == null && Math.random() < 0.55) {
              mode = "climb";
              wall = x <= 0 ? "left" : "right";
              target = H * (0.22 + Math.random() * 0.28);
            } else dir = dir === 1 ? -1 : 1;
          } else if (goalRef.current == null && Math.random() < dt * 0.12) {
            mode = "idle";
            until = now + 1200 + Math.random() * 1800;
          }
          break;
        }
        case "idle":
          if (wantTalk.current) {
            wantTalk.current = false;
            startTalk();
            break;
          }
          if (goalRef.current != null || now > until) {
            mode = "walk";
            if (goalRef.current == null && Math.random() < 0.4) dir = dir === 1 ? -1 : 1;
          }
          break;
        case "climb":
          y += 30 * dt;
          if (wantTalk.current || y >= target) {
            mode = "hang";
            until = now + (wantTalk.current ? 0 : 700 + Math.random() * 900);
          }
          break;
        case "hang":
          if (now > until) {
            mode = "fall";
            vy = 0;
            x = wall === "right" ? W - S : 0;
            wall = null;
            dir = x <= 0 ? 1 : -1;
          }
          break;
        case "fall":
          vy += 1500 * dt;
          y -= vy * dt;
          if (y <= 0) {
            y = 0;
            mode = "land";
            until = now + 650;
          }
          break;
        case "land":
          if (now > until) {
            if (wantTalk.current) {
              wantTalk.current = false;
              startTalk();
            } else mode = "walk";
          }
          break;
        case "talk":
          if (!talkRef.current) mode = "walk";
          break;
        default:
          break;
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, talking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    let reply = "";
    try {
      reply = ask(trimmed);
    } catch {
      reply = en ? "That failed. Try again." : "Eso falló. Probá de nuevo.";
    }
    setLines((rows) => {
      const next: Line[] = [
        ...rows,
        { role: "user", text: trimmed },
        { role: "mochi", text: reply },
      ];
      return next.slice(-40);
    });
    setDraft("");
  };

  const close = () => {
    talkRef.current = false;
    wantTalk.current = false;
    setTalking(false);
  };

  const suggestions = en
    ? ["What's open", "Open DjTube", "Summary", "Urgent tasks"]
    : ["Qué hay abierto", "Abrí DjTube", "Resumen", "Tareas urgentes"];

  const bubbleLeft = `clamp(8px, ${pos.x + pos.size / 2}px - 11rem, calc(100vw - 22rem - 8px))`;

  return (
    <div className="dk-mochi-layer">
      {talking ? (
        <form
          className="dk-chat"
          style={{ left: bubbleLeft, bottom: pos.size + 18 }}
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="dk-chat-log" ref={logRef}>
            {lines.map((line, i) => (
              <p key={i} className={line.role === "user" ? "is-user" : ""}>{line.text}</p>
            ))}
          </div>
          <div className="dk-suggest">
            {suggestions.map((item) => (
              <button key={item} type="button" onClick={() => send(item)}>{item}</button>
            ))}
          </div>
          <div className="dk-chat-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={en ? "Message Mochi" : "Mensaje para Mochi"}
              placeholder={en ? "Ask Mochi" : "Pedile a Mochi"}
              autoFocus
            />
            <button type="submit">{en ? "Send" : "Enviar"}</button>
            <button type="button" aria-label={en ? "Close" : "Cerrar"} onClick={close}>×</button>
          </div>
        </form>
      ) : null}
      <button
        ref={petRef}
        type="button"
        className="dk-mochi"
        aria-label={en ? "Mochi, tap to talk" : "Mochi, tocá para hablar"}
        aria-expanded={talking}
        onClick={() => {
          if (talkRef.current) return;
          wantTalk.current = true;
          const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          if (reduce) {
            talkRef.current = true;
            setTalking(true);
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- frame swaps are done on this element by the walk loop */}
        <img ref={spriteRef} src="/mochi/stand-neutral.png" alt="" draggable={false} />
      </button>
    </div>
  );
}
