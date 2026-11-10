"use client";

import { useEffect, useRef, useState } from "react";
import { transitionGain, type Track } from "@/desktop/model";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

type YtPlayer = {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allow: boolean) => void;
  setVolume: (n: number) => void;
  setPlaybackRate: (n: number) => void;
  destroy: () => void;
};

type YtWindow = Window & {
  YT?: { Player: new (el: HTMLElement, opts: unknown) => YtPlayer };
  onYouTubeIframeAPIReady?: () => void;
  __ytPromise?: Promise<void>;
};

function loadYt(): Promise<void> {
  const w = window as YtWindow;
  if (w.YT?.Player) return Promise.resolve();
  if (w.__ytPromise) return w.__ytPromise;
  w.__ytPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return w.__ytPromise;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function DjTube() {
  const { state, dispatch } = useDesk();
  const { locale } = useLocale();
  const en = locale === "en";
  const dj = state.djtube;
  const hostA = useRef<HTMLDivElement>(null);
  const hostB = useRef<HTMLDivElement>(null);
  const players = useRef<{ a: YtPlayer | null; b: YtPlayer | null }>({ a: null, b: null });
  const seen = useRef({ a: "", b: "", pa: false, pb: false, vol: "", ra: 1, rb: 1 });
  const root = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const busy = Boolean(dj.request);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    let dead = false;
    void loadYt().then(() => {
      if (dead) return;
      const YT = (window as YtWindow).YT;
      if (!YT || !hostA.current || !hostB.current) return;
      const make = (host: HTMLDivElement, key: "a" | "b") => {
        const mount = document.createElement("div");
        host.appendChild(mount);
        const player = new YT.Player(mount, {
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              players.current[key] = player;
              setReady((n) => n + 1);
            },
          },
        });
        return player;
      };
      const a = make(hostA.current, "a");
      const b = make(hostB.current, "b");
      players.current = { a, b };
    });
    return () => {
      dead = true;
      try { players.current.a?.destroy(); } catch { /* already gone */ }
      try { players.current.b?.destroy(); } catch { /* already gone */ }
      players.current = { a: null, b: null };
    };
  }, []);

  useEffect(() => {
    const pa = players.current.a;
    const pb = players.current.b;
    if (pa && dj.deckA && seen.current.a !== dj.deckA) {
      seen.current.a = dj.deckA;
      pa.loadVideoById(dj.deckA);
    }
    if (pb && dj.deckB && seen.current.b !== dj.deckB) {
      seen.current.b = dj.deckB;
      pb.loadVideoById(dj.deckB);
    }
    const gain = transitionGain(dj.crossfader);
    const vol = `${gain.a.toFixed(3)}:${dj.volA}:${gain.b.toFixed(3)}:${dj.volB}`;
    if (seen.current.vol !== vol) {
      seen.current.vol = vol;
      pa?.setVolume(Math.round(gain.a * dj.volA * 100));
      pb?.setVolume(Math.round(gain.b * dj.volB * 100));
    }
    if (pa && seen.current.pa !== dj.playingA) {
      seen.current.pa = dj.playingA;
      if (dj.playingA) pa.playVideo();
      else pa.pauseVideo();
    }
    if (pb && seen.current.pb !== dj.playingB) {
      seen.current.pb = dj.playingB;
      if (dj.playingB) pb.playVideo();
      else pb.pauseVideo();
    }
    if (pa && seen.current.ra !== dj.rateA) {
      seen.current.ra = dj.rateA;
      pa.setPlaybackRate(dj.rateA);
    }
    if (pb && seen.current.rb !== dj.rateB) {
      seen.current.rb = dj.rateB;
      pb.setPlaybackRate(dj.rateB);
    }
  }, [dj, ready]);

  useEffect(() => {
    const req = dj.request;
    if (!req) return;
    let cancel = false;
    void fetch(`/api/desk/youtube?q=${encodeURIComponent(req.q)}`)
      .then((r) => r.json())
      .then((data: { ok?: boolean; items?: Track[]; error?: string }) => {
        if (cancel) return;
        const items = data.items ?? [];
        dispatch({
          op: "set",
          recipe: (s) => {
            if (s.djtube.request?.n !== req.n) return s;
            let queue = s.djtube.queue;
            let deckA = s.djtube.deckA;
            let deckB = s.djtube.deckB;
            const add = (track: Track) => {
              if (!queue.some((item) => item.videoId === track.videoId)) queue = [...queue, track];
            };
            if (req.load === "queue") items.forEach(add);
            if ((req.load === "a" || req.load === "b") && items[0]) {
              add(items[0]);
              if (req.load === "a") deckA = items[0].videoId;
              else deckB = items[0].videoId;
            }
            if (!req.load && items[0]) items.forEach(add);
            return {
              ...s,
              djtube: {
                ...s.djtube,
                results: items,
                queue,
                deckA,
                deckB,
                request: null,
                note: items.length ? "" : data.error || "empty",
                playingA: req.load === "a" ? true : s.djtube.playingA,
                playingB: req.load === "b" ? true : s.djtube.playingB,
              },
            };
          },
        });
        if (!items.length) setErr(en ? "No results. Paste a YouTube link." : "Sin resultados. Pegá un link de YouTube.");
      })
      .catch(() => {
        if (!cancel) setErr(en ? "Search failed. Paste a link." : "Falló la búsqueda. Pegá un link.");
      });
    return () => {
      cancel = true;
    };
  }, [dj.request, dispatch, en]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (!root.current?.closest(".dk-win.is-focus")) return;
      if (e.code === "Space") {
        e.preventDefault();
        const on = !(dj.playingA || dj.playingB);
        dispatch({ op: "yt", patch: { playingA: on, playingB: on } });
      } else if (e.key === "q" || e.key === "Q") {
        dispatch({ op: "yt", patch: { playingA: !dj.playingA } });
      } else if (e.key === "w" || e.key === "W") {
        dispatch({ op: "yt", patch: { playingB: !dj.playingB } });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 0.15 : 0.05;
        const next = Math.min(1, Math.max(0, dj.crossfader + (e.key === "ArrowRight" ? step : -step)));
        dispatch({ op: "yt", patch: { crossfader: next } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dj.playingA, dj.playingB, dj.crossfader, dispatch]);

  const search = (load: "a" | "b" | "queue" | null) => {
    const text = q.trim();
    if (!text) return;
    setErr("");
    dispatch({
      op: "yt",
      patch: { request: { n: (dj.request?.n ?? 0) + 1, q: text, load }, note: text },
    });
  };

  const loadDeck = (deck: "a" | "b", track: Track) => {
    dispatch({
      op: "set",
      recipe: (s) => ({
        ...s,
        djtube: {
          ...s.djtube,
          queue: s.djtube.queue.some((item) => item.videoId === track.videoId) ? s.djtube.queue : [...s.djtube.queue, track],
          deckA: deck === "a" ? track.videoId : s.djtube.deckA,
          deckB: deck === "b" ? track.videoId : s.djtube.deckB,
          playingA: deck === "a" ? true : s.djtube.playingA,
          playingB: deck === "b" ? true : s.djtube.playingB,
        },
      }),
    });
  };

  const title = (id: string | null) => dj.queue.find((t) => t.videoId === id)?.title ?? (en ? "Empty" : "Vacío");
  const gain = transitionGain(dj.crossfader);

  const deck = (which: "a" | "b") => {
    const playing = which === "a" ? dj.playingA : dj.playingB;
    const rate = which === "a" ? dj.rateA : dj.rateB;
    return (
      <section className="dk-deck" aria-label={which === "a" ? "Deck A" : "Deck B"}>
        <header>
          <strong>{which.toUpperCase()}</strong>
          <span>{title(which === "a" ? dj.deckA : dj.deckB)}</span>
        </header>
        <div className={`dk-disc${playing ? " is-on" : ""}`} ref={which === "a" ? hostA : hostB} />
        <div className="dk-deck-controls">
          <button type="button" onClick={() => dispatch({ op: "yt", patch: which === "a" ? { playingA: !playing } : { playingB: !playing } })}>
            {playing ? (en ? "Pause" : "Pausa") : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              const p = players.current[which];
              p?.seekTo(0, true);
              p?.pauseVideo();
              dispatch({ op: "yt", patch: which === "a" ? { playingA: false } : { playingB: false } });
            }}
          >
            {en ? "Back" : "Volver"}
          </button>
          <label>
            {rate.toFixed(2)}x
            <input
              type="range"
              min={0}
              max={RATES.length - 1}
              step={1}
              value={Math.max(0, RATES.indexOf(rate))}
              aria-label={en ? "Speed" : "Velocidad"}
              onChange={(e) => {
                const next = RATES[Number(e.target.value)] ?? 1;
                dispatch({ op: "yt", patch: which === "a" ? { rateA: next } : { rateB: next } });
              }}
            />
          </label>
        </div>
      </section>
    );
  };

  return (
    <div className="dk-dj" ref={root}>
      <aside className="dk-dj-side">
        <form
          className="dk-search"
          onSubmit={(e) => {
            e.preventDefault();
            search("queue");
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={en ? "Search or paste a YouTube link" : "Buscar o pegar un link de YouTube"}
            aria-label={en ? "Search" : "Buscar"}
          />
          <button type="submit" disabled={busy}>
            {busy ? "…" : en ? "Queue" : "Cola"}
          </button>
        </form>
        {err ? <p className="dk-muted">{err}</p> : null}
        {dj.results.length ? (
          <ul className="dk-q">
            {dj.results.map((track) => (
              <li key={`r-${track.videoId}`}>
                <span>{track.title}</span>
                <button type="button" onClick={() => loadDeck("a", track)}>A</button>
                <button type="button" onClick={() => loadDeck("b", track)}>B</button>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="dk-q">
          {dj.queue.map((track) => (
            <li key={track.videoId}>
              <span>{track.title}</span>
              <button type="button" onClick={() => loadDeck("a", track)}>A</button>
              <button type="button" onClick={() => loadDeck("b", track)}>B</button>
              <button
                type="button"
                aria-label={en ? "Remove" : "Quitar"}
                onClick={() =>
                  dispatch({
                    op: "set",
                    recipe: (s) => ({
                      ...s,
                      djtube: {
                        ...s.djtube,
                        queue: s.djtube.queue.filter((item) => item.videoId !== track.videoId),
                        deckA: s.djtube.deckA === track.videoId ? null : s.djtube.deckA,
                        deckB: s.djtube.deckB === track.videoId ? null : s.djtube.deckB,
                      },
                    }),
                  })
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="dk-decks">
        <div className="dk-deck-row">
          {deck("a")}
          {deck("b")}
        </div>
        <div className="dk-fader">
          <label>
            A {Math.round(gain.a * dj.volA * 100)}
            <input
              className="dk-vol"
              type="range"
              min={0}
              max={100}
              value={Math.round(dj.volA * 100)}
              aria-label={en ? "Volume A" : "Volumen A"}
              onChange={(e) => dispatch({ op: "yt", patch: { volA: Number(e.target.value) / 100 } })}
            />
          </label>
          <label className="dk-fader-main">
            <span>
              {en ? "Crossfader" : "Crossfader"} {Math.round(dj.crossfader * 100)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(dj.crossfader * 100)}
              aria-label="Crossfader"
              onChange={(e) => dispatch({ op: "yt", patch: { crossfader: Number(e.target.value) / 100 } })}
            />
          </label>
          <label>
            B {Math.round(gain.b * dj.volB * 100)}
            <input
              className="dk-vol"
              type="range"
              min={0}
              max={100}
              value={Math.round(dj.volB * 100)}
              aria-label={en ? "Volume B" : "Volumen B"}
              onChange={(e) => dispatch({ op: "yt", patch: { volB: Number(e.target.value) / 100 } })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
