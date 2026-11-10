/** Desktop math, ticket reading, households, and Mochi's window commands. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runCommand } from "../src/desktop/commands.ts";
import {
  FIXED_NOW,
  applyOp,
  parseAmount,
  parseTicket,
  seed,
  settle,
  transitionGain,
  type CmdCtx,
} from "../src/desktop/model.ts";
import { collectVideos, parseYouTubeRef } from "../src/desktop/youtube.ts";

function ctx(locale: "es" | "en" = "es"): CmdCtx {
  let n = 0;
  return {
    w: 1280,
    h: 720,
    mobile: false,
    now: FIXED_NOW,
    id: () => `id-${++n}`,
    locale,
  };
}

function noDash(text: string) {
  assert.equal(text.includes("\u2014"), false, text);
  assert.equal(text.includes("\u2013"), false, text);
}

test("crossfader keeps both decks full at the center", () => {
  assert.deepEqual(transitionGain(0), { a: 1, b: 0 });
  assert.deepEqual(transitionGain(0.5), { a: 1, b: 1 });
  assert.deepEqual(transitionGain(1), { a: 0, b: 1 });
  assert.deepEqual(transitionGain(0.25), { a: 1, b: 0.5 });
});

test("amounts accept AR and US grouping", () => {
  assert.equal(parseAmount("5000"), 5000);
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("1,234.56"), 1234.56);
  assert.equal(parseAmount("$ 8.900,50"), 8900.5);
  assert.equal(parseAmount("12.345"), 12345);
});

test("ticket text yields merchant and total", () => {
  const read = parseTicket("Kiosco\nTOTAL 2.500\n12/03/2026");
  assert.equal(read.merchant, "Kiosco");
  assert.equal(read.total, 2500);
  assert.equal(read.date, "2026-03-12");
  assert.equal(read.currency, "ARS");
});

test("household split sends the balance to whoever paid", () => {
  const rows = settle(
    [
      { id: "me", name: "Vos" },
      { id: "luz", name: "Luz" },
    ],
    [{ payerId: "me", amount: 80, memberIds: ["me", "luz"] }],
  );
  assert.deepEqual(rows, [{ fromId: "luz", toId: "me", amount: 40 }]);
});

test("windows open once, focus, resize and close", () => {
  const c = ctx();
  let state = seed(FIXED_NOW);
  let out = runCommand("abrí DjTube", state, c);
  state = out.state;
  assert.equal(state.windows.length, 1);
  assert.equal(state.windows[0].app, "djtube");
  assert.equal(state.mode, "desktop");
  const z = state.windows[0].z;
  out = runCommand("abrí Garpen", state, c);
  state = out.state;
  out = runCommand("abrí DjTube", state, c);
  state = out.state;
  assert.equal(state.windows.length, 2);
  assert.ok(state.windows.find((w) => w.app === "djtube")!.z > z);
  out = runCommand("poné Tarask a la izquierda", state, c);
  state = out.state;
  const tarask = state.windows.find((w) => w.app === "tarask");
  assert.ok(tarask);
  assert.equal(tarask.x, 0);
  assert.equal(tarask.w, 640);
  out = runCommand("cerrá todo", state, c);
  assert.equal(out.state.windows.length, 0);
  noDash(out.reply);
});

test("queries and app actions", () => {
  const c = ctx();
  const base = seed(FIXED_NOW);
  const empty = runCommand("qué hay abierto", base, c);
  assert.match(empty.reply, /No hay ventanas/);
  noDash(empty.reply);

  const gasto = runCommand("gasto de 5000 super", base, c);
  assert.ok(gasto.state.txs.some((t) => t.kind === "expense" && t.amount === 5000));
  assert.ok(gasto.state.windows.some((w) => w.app === "tarask"));

  const ticket = runCommand("leé este ticket: Kiosco\nTOTAL 2500", base, c);
  assert.ok(ticket.state.txs.some((t) => t.memo.startsWith("Kiosco") && t.amount === 2500));

  const mail = runCommand("escribile a Ana: Hola | Nos vemos", base, c);
  const sent = mail.state.mail.find((m) => m.folder === "sent" && m.subject === "Hola");
  assert.ok(sent);
  assert.equal(sent?.to, "Ana Pérez");
  assert.equal(sent?.body, "Nos vemos");

  const moved = runCommand("mové comprar café a hecho", base, c);
  assert.equal(moved.state.tasks.find((t) => t.title === "Comprar café")?.status, "done");
  assert.equal(moved.state.mode, "tasks");

  const added = runCommand("nueva tarea urgente llamar al banco", base, c);
  const task = added.state.tasks.find((t) => t.title === "llamar al banco");
  assert.equal(task?.priority, "urgent");
  assert.equal(task?.status, "todo");

  const help = runCommand("ayuda", base, c);
  noDash(help.reply);
  assert.match(help.reply, /DjTube/);

  const en = runCommand("open Malito", base, ctx("en"));
  assert.match(en.reply, /Opened Malito/);
  assert.ok(en.state.windows.some((w) => w.app === "malito"));
  noDash(en.reply);
});

test("fader and timer ops land in state", () => {
  const c = ctx();
  const base = seed(FIXED_NOW);
  const faded = runCommand("fader al centro", base, c);
  assert.equal(faded.state.djtube.crossfader, 0.5);
  const started = runCommand("arrancá el timer de Ana", base, c);
  assert.equal(started.state.timer.running, true);
  assert.equal(started.state.timer.contactId, "c-ana");
  const stopped = applyOp(started.state, { op: "timer", action: "stop" }, { ...c, now: c.now + 90_000 });
  assert.equal(stopped.timer.running, false);
  assert.equal(stopped.entries.length, 1);
  assert.ok(stopped.movements[0].amount > 0);
});

test("youtube refs and innertube walker", () => {
  assert.deepEqual(parseYouTubeRef("abcdefghijk"), { videoId: "abcdefghijk" });
  assert.equal(parseYouTubeRef("https://youtu.be/abcdefghijk")?.videoId, "abcdefghijk");
  assert.equal(parseYouTubeRef("https://www.youtube.com/watch?v=abcdefghijk&list=PLabcdefghijklmnop")?.playlistId, "PLabcdefghijklmnop");
  const items = collectVideos({
    contents: [{ videoRenderer: { videoId: "abcdefghijk", title: { simpleText: "Hola &amp; chau" }, ownerText: { simpleText: "Canal" } } }],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Hola & chau");
  assert.equal(items[0].channel, "Canal");
});
