/**
 * Natural-language commands for Mochi. Spanish and English.
 * Window verbs: open, close, focus, resize. Plus queries and app actions.
 */

import {
  type AppId,
  type CmdCtx,
  type DeskState,
  type Op,
  type Priority,
  type TaskStatus,
  type YtLoad,
  appName,
  applyOp,
  describeApp,
  describeTasks,
  describeWindows,
  findContact,
  focusedWin,
  isoDay,
  norm,
  parseAmount,
  parseTicket,
  summarize,
} from "./model";

type Plan = { ops: Op[]; reply: (s: DeskState) => string };

function enOf(locale: CmdCtx["locale"]): boolean {
  return locale === "en";
}

function help(en: boolean): string {
  if (en) {
    return "I can open, close, focus and resize windows. I can also read what is inside and run actions. Try: open DjTube, close Malito, focus Garpen, put Tarask on the left, search daft punk and load it on deck A, play, fader to the center, new contact Ana, start the timer, expense 5000 groceries, read this ticket: Kiosk TOTAL 2500, summary, email Ana: Hello | See you tomorrow, new urgent task buy coffee, move buy coffee to done.";
  }
  return "Puedo abrir, cerrar, enfocar y cambiar el tamaño de las ventanas. También miro lo que hay adentro y disparo acciones. Probá: abrí DjTube, cerrá Malito, enfocá Garpen, poné Tarask a la izquierda, buscá daft punk y cargalo en el deck A, play, fader al centro, nuevo contacto Ana, arrancá el timer, gasto de 5000 super, leé este ticket: Kiosco TOTAL 2500, resumen, escribile a Ana: Hola | Nos vemos mañana, nueva tarea urgente comprar café, mové comprar café a hecho.";
}

const APP_RES: [RegExp, AppId][] = [
  [/\b(djtube|dj tube|youtube)\b/, "djtube"],
  [/\b(garpen|erp|crm)\b/, "garpen"],
  [/\b(tarask|cuentix)\b/, "tarask"],
  [/\b(malito)\b/, "malito"],
  [/\b(portfolio|portafolio)\b/, "portfolio"],
];

function mentionedApp(t: string): AppId | null {
  for (const [re, id] of APP_RES) if (re.test(t)) return id;
  return null;
}

function wantsTasks(t: string): boolean {
  return /\b(tareas|tablero|kanban|tasks|board)\b/.test(t);
}

function currencyOf(t: string): "ARS" | "USD" {
  return /\b(usd|dolar|dolares|us\$)\b/.test(t) ? "USD" : "ARS";
}

function amountIn(t: string): { value: number; raw: string } | null {
  const m = t.match(/(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const value = parseAmount(m[1]);
  if (value == null) return null;
  return { value, raw: m[1] };
}

function memoAfter(t: string, raw: string): string {
  const i = t.indexOf(raw);
  let rest = i >= 0 ? t.slice(i + raw.length) : t;
  rest = rest.replace(/\b(en|el|la|los|las|de|del|por|un|una|pesos|ars|usd|dolares|dolar|tarask|garpen|gasto|ingreso|egreso)\b/g, " ");
  return rest.replace(/\s+/g, " ").trim().slice(0, 80);
}

function priorityOf(t: string): Priority | undefined {
  if (/\b(urgente|urgent)\b/.test(t)) return "urgent";
  if (/\b(alta|high)\b/.test(t)) return "high";
  if (/\b(baja|low)\b/.test(t)) return "low";
  if (/\b(normal|media|medium)\b/.test(t)) return "normal";
  return undefined;
}

function statusOf(t: string): TaskStatus | null {
  if (/\b(pendiente|pendientes|todo|to do|backlog)\b/.test(t)) return "todo";
  if (/\b(en curso|curso|doing|progreso|progress|in progress)\b/.test(t)) return "doing";
  if (/\b(revision|review)\b/.test(t)) return "review";
  if (/\b(hecho|hecha|hechas|done|cerrad[oa]|closed|listo|lista)\b/.test(t)) return "done";
  return null;
}

function open(app: AppId): Op {
  return { op: "open", app };
}

function targetApp(t: string, state: DeskState): AppId | null {
  return mentionedApp(t) ?? focusedWin(state)?.app ?? null;
}

function cleanSearch(q: string): { q: string; load: YtLoad } {
  let load: YtLoad = "queue";
  let text = q;
  const deckA = /\b(?:deck|plato)\s*a\b|\ben\s+a\b/i.test(text);
  const deckB = /\b(?:deck|plato)\s*b\b|\ben\s+b\b/i.test(text);
  if (deckA) load = "a";
  else if (deckB) load = "b";
  text = text
    .replace(/\b(y\s+)?(cargalo|ponelo|load it|ponerlo|cargala)\b.*$/i, "")
    .replace(/\b(en\s+el\s+)?(deck|plato)\s*[ab]\b/gi, "")
    .replace(/\b(en\s+)?(djtube|youtube|la cola|the queue)\b/gi, "")
    .replace(/\b(por favor|please)\b/gi, "")
    .trim();
  return { q: text, load };
}

function plan(text: string, state: DeskState, ctx: CmdCtx): Plan {
  const raw = text.trim();
  const t = norm(raw);
  const en = enOf(ctx.locale);
  const say = (s: string): Plan => ({ ops: [], reply: () => s });
  if (!t) return say(en ? "Tell me what to do." : "Decime qué hago.");
  if (/^(ayuda|help|que podes hacer|what can you do)/.test(t)) return say(help(en));

  if (/\b(cerra|cierra|cerrar|close)\b/.test(t) && /\b(todo|todas|todo lo|all|everything)\b/.test(t)) {
    return { ops: [{ op: "close", app: "all" }], reply: () => (en ? "Closed every window." : "Cerré todas las ventanas.") };
  }

  if (wantsTasks(t) && /\b(abri|abre|abrir|open|mostra|mostrar|show|anda|ir|go|modo|mode)\b/.test(t)) {
    return { ops: [{ op: "mode", mode: "tasks" }], reply: () => (en ? "Tasks board." : "Tablero de tareas.") };
  }
  if (/\b(escritorio|desktop)\b/.test(t) && /\b(abri|abre|abrir|volver|volvé|volve|back|mostra|show|open|modo|mode)\b/.test(t)) {
    return { ops: [{ op: "mode", mode: "desktop" }], reply: () => (en ? "Back to the desktop." : "Volví al escritorio.") };
  }

  if (/\bticket\b/.test(t) || /lee este ticket|read this ticket|leer ticket/.test(t)) {
    const body = raw.replace(/^[\s\S]*?ticket\s*:?\s*/i, "");
    const ticket = parseTicket(body || raw);
    if (ticket.total == null) {
      return say(en ? "I could not find a total. Paste a line with TOTAL and the amount." : "No encontré el total. Pegá una línea con TOTAL y el monto.");
    }
    const memo = ticket.merchant || (en ? "Ticket" : "Ticket");
    return {
      ops: [
        open("tarask"),
        { op: "tx", kind: "expense", amount: ticket.total, memo, category: undefined, currency: ticket.currency, at: ticket.date ?? undefined },
      ],
      reply: () =>
        en
          ? `Loaded ${memo} as an expense of ${ticket.total} ${ticket.currency} in Tarask.`
          : `Cargué ${memo} como gasto de ${ticket.total} ${ticket.currency} en Tarask.`,
    };
  }

  if (/^busca/.test(t) && !/\b(mail|correo|contacto|tarea|gasto)\b/.test(t)) {
    const m = raw.match(/busca(?:r|me)?\s+([\s\S]+)/i);
    const cleaned = cleanSearch(m?.[1] ?? "");
    if (!cleaned.q) return say(en ? "Search for what?" : "¿Qué busco?");
    const n = (state.djtube.request?.n ?? 0) + 1;
    return {
      ops: [open("djtube"), { op: "yt", patch: { request: { n, q: cleaned.q, load: cleaned.load }, note: cleaned.q } }],
      reply: () =>
        en
          ? `Searching “${cleaned.q}” on DjTube${cleaned.load === "a" || cleaned.load === "b" ? ` and loading deck ${cleaned.load.toUpperCase()}` : ""}.`
          : `Busco “${cleaned.q}” en DjTube${cleaned.load === "a" || cleaned.load === "b" ? ` y lo cargo en el deck ${cleaned.load.toUpperCase()}` : ""}.`,
    };
  }

  if (/\b(fader|crossfader|mezcla)\b/.test(t)) {
    let pos = 0.5;
    if (/\b(izquierda|left|solo a)\b/.test(t)) pos = 0;
    else if (/\b(derecha|right|solo b)\b/.test(t)) pos = 1;
    else if (/\b(centro|medio|center|ambos|both)\b/.test(t)) pos = 0.5;
    else {
      const hit = amountIn(t);
      if (hit) pos = hit.value > 1 ? Math.min(100, hit.value) / 100 : Math.min(1, Math.max(0, hit.value));
    }
    return {
      ops: [open("djtube"), { op: "yt", patch: { crossfader: pos } }],
      reply: () => (en ? `Fader at ${Math.round(pos * 100)}.` : `Fader en ${Math.round(pos * 100)}.`),
    };
  }

  if (/\bvolumen\b/.test(t) || /\bvolume\b/.test(t)) {
    const hit = amountIn(t);
    const value = hit ? (hit.value > 1 ? Math.min(100, hit.value) / 100 : Math.min(1, hit.value)) : 1;
    const patch = /\bdeck\s*b\b|\bvolumen de b\b|\bvolume b\b/.test(t) ? { volB: value } : { volA: value };
    const which = "volB" in patch ? "B" : "A";
    return {
      ops: [open("djtube"), { op: "yt", patch }],
      reply: () => (en ? `Deck ${which} volume ${Math.round(value * 100)}.` : `Volumen del deck ${which} en ${Math.round(value * 100)}.`),
    };
  }

  if (/\b(play|pausa|pause|reproduci|reproducir)\b/.test(t) && (mentionedApp(t) === "djtube" || mentionedApp(t) === null || /\b(deck|ambos|both)\b/.test(t))) {
    const pause = /\b(pausa|pause)\b/.test(t);
    const onlyA = /\bdeck\s*a\b|\bsolo a\b/.test(t);
    const onlyB = /\bdeck\s*b\b|\bsolo b\b/.test(t);
    const patch = onlyA
      ? { playingA: !pause }
      : onlyB
        ? { playingB: !pause }
        : { playingA: !pause, playingB: !pause };
    return {
      ops: [open("djtube"), { op: "yt", patch }],
      reply: () => (pause ? (en ? "Paused." : "Pausé.") : en ? "Play. If the browser blocks it, press play on the deck." : "Play. Si el navegador lo frena, tocá play en el deck."),
    };
  }

  const mailWrite = raw.match(/escrib(?:ile|i|ir|e)?\s+a\s+([^:]+):\s*([\s\S]+)/i) || raw.match(/(?:mail|email|correo)\s+(?:a|to)\s+([^:]+):\s*([\s\S]+)/i);
  if (mailWrite) {
    const to = mailWrite[1].trim();
    const rest = mailWrite[2].trim();
    const [subject, ...bodyParts] = rest.split("|");
    const body = (bodyParts.join("|").trim() || subject).trim();
    const sub = bodyParts.length ? subject.trim() : rest.slice(0, 60);
    return {
      ops: [open("malito"), { op: "mailSend", to, subject: sub, body }],
      reply: (s) => {
        const sent = s.mail.find((m) => m.folder === "sent" && norm(m.to).includes(norm(to)));
        return sent
          ? en
            ? `Sent “${sent.subject}” to ${sent.to}. It is in Sent. Contacts stay synced with Garpen.`
            : `Mandé “${sent.subject}” a ${sent.to}. Quedó en Enviados. Los contactos siguen los de Garpen.`
          : en
            ? "I need a recipient and a message."
            : "Me falta destinatario o mensaje.";
      },
    };
  }

  if (/\b(mails?|correo|inbox)\b/.test(t) && /\b(lee|leer|lei|leé|read|ultimo|última|last|sin leer|unread)\b/.test(t)) {
    if (/\b(todos|todas|all)\b/.test(t) && /\b(leido|leidos|leída|read)\b/.test(t)) {
      return { ops: [open("malito"), { op: "mailReadAll" }], reply: () => (en ? "Marked everything read." : "Marqué todo como leído.") };
    }
    const who = t.match(/\b(?:de|from)\s+([a-z0-9 ]+)/)?.[1]?.trim();
    return {
      ops: [open("malito"), { op: "mailRead", who }],
      reply: (s) => {
        const hit = who
          ? s.mail.find((m) => m.folder === "inbox" && norm(`${m.from} ${m.subject}`).includes(norm(who)))
          : s.mail.find((m) => m.folder === "inbox");
        if (!hit) return en ? "The inbox is empty." : "La bandeja está vacía.";
        return en ? `${hit.from}: ${hit.subject}. ${hit.body}` : `${hit.from}: ${hit.subject}. ${hit.body}`;
      },
    };
  }

  if (/\b(timer|cronometro|temporizador)\b/.test(t)) {
    if (/\b(para|parar|frena|frenar|stop|deten)\b/.test(t)) {
      return {
        ops: [open("garpen"), { op: "timer", action: "stop" }],
        reply: (s) => {
          const last = s.entries[0];
          if (!last) return en ? "The timer was not running." : "El timer no estaba corriendo.";
          const mins = Math.round(last.seconds / 60);
          return en
            ? `Stopped. ${mins} min${last.billable ? ", billed to Por cobrar." : "."}`
            : `Paré. ${mins} min${last.billable ? ", cargados en Por cobrar." : "."}`;
        },
      };
    }
    const who = raw.match(/\b(?:de|for|para)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{2,40})/)?.[1]?.trim();
    const rate = /\b(tarifa|rate)\b/.test(t) ? amountIn(t)?.value : undefined;
    return {
      ops: [open("garpen"), { op: "timer", action: "start", contactName: who, rate }],
      reply: () => (en ? `Timer started${who ? ` for ${who}` : ""}.` : `Arranqué el timer${who ? ` de ${who}` : ""}.`),
    };
  }

  const contactAdd = raw.match(/(?:nuevo|agrega(?:r)?|crear|add)\s+contacto\s+(.+)/i) || raw.match(/new contact\s+(.+)/i);
  if (contactAdd) {
    const bit = contactAdd[1].trim();
    const email = bit.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] ?? "";
    const phone = bit.match(/\+?\d[\d\s()-]{6,}/)?.[0]?.trim() ?? "";
    const name = bit.replace(email, "").replace(phone, "").replace(/\s+/g, " ").trim();
    return {
      ops: [open("garpen"), { op: "contactAdd", name, email, phone }],
      reply: () => (en ? `Added ${name} to Garpen. Malito uses the same contacts.` : `Agregué a ${name} en Garpen. Malito usa los mismos contactos.`),
    };
  }

  if (/\bagenda\b/.test(t) && /\b(nueva|agrega|anota|anotá|add)\b/.test(t)) {
    const title = raw.replace(/^[\s\S]*?agenda\s*/i, "").replace(/^(nueva|agrega|anota|anotá|add)\s*/i, "").trim();
    return {
      ops: [open("garpen"), { op: "agendaAdd", title: title || raw, due: isoDay(ctx.now) }],
      reply: () => (en ? `On the agenda: ${title}.` : `En la agenda: ${title}.`),
    };
  }

  if (/\b(movimiento|caja|banco)\b/.test(t) && (mentionedApp(t) === "garpen" || /\b(cuenta|caja|banco)\b/.test(t)) && amountIn(t)) {
    const hit = amountIn(t)!;
    const dir = /\b(egreso|salida|gasto|resta|out)\b/.test(t) ? "out" : "in";
    const accountName = /\bbanco\b/.test(t) ? "Banco" : /\bcobrar\b/.test(t) ? "Por cobrar" : "Caja";
    return {
      ops: [open("garpen"), { op: "movement", amount: Math.abs(hit.value), memo: memoAfter(t, hit.raw) || accountName, dir, accountName }],
      reply: () => (en ? `Movement on ${accountName}.` : `Movimiento en ${accountName}.`),
    };
  }

  if (/\b(pague|pagué|pago)\b/.test(t) && /\b(deuda|tarjeta|prestamo|préstamo)\b/.test(t)) {
    const hit = amountIn(t);
    if (!hit) return say(en ? "How much did you pay?" : "¿Cuánto pagaste?");
    const name = /\btarjeta\b/.test(t) ? "tarjeta" : "deuda";
    return {
      ops: [open("tarask"), { op: "debtPay", name, amount: Math.abs(hit.value) }],
      reply: () => (en ? "Payment applied to the debt." : "Apliqué el pago a la deuda."),
    };
  }

  if (/\b(deuda|tarjeta)\b/.test(t) && /\b(nueva|agrega|add|tengo)\b/.test(t)) {
    const hit = amountIn(t);
    if (!hit) return say(en ? "What is the balance?" : "¿De cuánto es?");
    const name = memoAfter(t, hit.raw) || (en ? "Card" : "Tarjeta");
    return {
      ops: [open("tarask"), { op: "debtAdd", name, balance: Math.abs(hit.value), currency: currencyOf(t) }],
      reply: () => (en ? `Debt “${name}” added.` : `Sumé la deuda “${name}”.`),
    };
  }

  if (/\b(ahorr|reserva|saving)\b/.test(t) && amountIn(t)) {
    const hit = amountIn(t)!;
    const name = memoAfter(t, hit.raw) || "Reserva";
    return {
      ops: [open("tarask"), { op: "savingDeposit", name, amount: Math.abs(hit.value) }],
      reply: () => (en ? `Set aside ${Math.abs(hit.value)} toward savings.` : `Aparté ${Math.abs(hit.value)} en ahorros.`),
    };
  }

  if (/\b(compartido|hogar|household|casa)\b/.test(t) && /\b(gasto|expense)\b/.test(t) && amountIn(t)) {
    const hit = amountIn(t)!;
    return {
      ops: [open("tarask"), { op: "houseExpense", amount: Math.abs(hit.value), memo: memoAfter(t, hit.raw) || "Gasto", currency: currencyOf(t) }],
      reply: () => (en ? "Shared expense added. The split is equal." : "Sumé el gasto compartido. El reparto es parejo."),
    };
  }

  if (/\b(gasto|expense|egreso)\b/.test(t) && amountIn(t) && mentionedApp(t) !== "garpen") {
    const hit = amountIn(t)!;
    const memo = memoAfter(t, hit.raw) || (en ? "Expense" : "Gasto");
    return {
      ops: [open("tarask"), { op: "tx", kind: "expense", amount: Math.abs(hit.value), memo, currency: currencyOf(t) }],
      reply: () => (en ? `Expense ${memo} in Tarask.` : `Gasto ${memo} en Tarask.`),
    };
  }

  if (/\b(ingreso|income|sueldo|cobre|cobré)\b/.test(t) && amountIn(t) && !/\bgarpen\b/.test(t)) {
    const hit = amountIn(t)!;
    const memo = memoAfter(t, hit.raw) || (en ? "Income" : "Ingreso");
    return {
      ops: [open("tarask"), { op: "tx", kind: "income", amount: Math.abs(hit.value), memo, currency: currencyOf(t) }],
      reply: () => (en ? `Income ${memo} in Tarask.` : `Ingreso ${memo} en Tarask.`),
    };
  }

  const move = t.match(/\bmov(?:e|er|é)?\s+(?:la\s+tarea\s+)?(.+?)\s+a\s+(.+)$/);
  if (move && statusOf(move[2])) {
    const title = move[1];
    const status = statusOf(move[2])!;
    const exists = state.tasks.some((task) => norm(task.title).includes(norm(title)));
    if (!exists) return say(en ? `I don't see a task called “${title}”.` : `No veo una tarea que se llame “${title}”.`);
    return {
      ops: [{ op: "mode", mode: "tasks" }, { op: "taskMove", title, status }],
      reply: () => (en ? `Moved “${title}”.` : `Moví “${title}”.`),
    };
  }

  const added = raw.match(/(?:nueva|agregar|agrega|crear|add)\s+tarea\s+(.+)/i) || raw.match(/new task\s+(.+)/i);
  if (added) {
    let title = added[1].trim();
    const pr = priorityOf(norm(title));
    title = title.replace(/\b(urgente|urgent|alta|high|baja|low|normal|en el tablero|on the board)\b/gi, "").replace(/\s+/g, " ").trim();
    const list = /\bpersonal\b/i.test(added[1]) ? "Personal" : /\btrabajo\b/i.test(added[1]) ? "Trabajo" : undefined;
    title = title.replace(/\b(en\s+)?(personal|trabajo|work|home)\b/gi, "").trim();
    return {
      ops: [{ op: "mode", mode: "tasks" }, { op: "taskAdd", title, list, priority: pr }],
      reply: () => (en ? `Task “${title}” is on the board.` : `La tarea “${title}” está en el tablero.`),
    };
  }

  const app = targetApp(t, state);
  const resizeWord = /\b(maximiza|maximizar|maximize|agranda|agrandar|pantalla completa|full ?screen)\b/.test(t);
  const minWord = /\b(minimiza|minimizar|minimize|esconde|esconder)\b/.test(t);
  const leftWord = /\b(izquierda|left)\b/.test(t);
  const rightWord = /\b(derecha|right)\b/.test(t);
  const size = t.match(/\b(\d{2,4})\s*x\s*(\d{2,4})\b/);
  if ((resizeWord || minWord || leftWord || rightWord || size) && (app || focusedWin(state))) {
    const which = app ?? focusedWin(state)!.app;
    const box = minWord ? "min" : resizeWord ? "max" : leftWord ? "left" : rightWord ? "right" : { w: Number(size![1]), h: Number(size![2]) };
    const label = en ? appName(which, "en") : appName(which, "es");
    return {
      ops: [{ op: "box", app: which, box }],
      reply: () => (en ? `Resized ${label}.` : `Cambié el tamaño de ${label}.`),
    };
  }

  if (app && /\b(cerra|cierra|cerrar|close)\b/.test(t)) {
    return {
      ops: [{ op: "close", app }],
      reply: () => (en ? `Closed ${appName(app, "en")}.` : `Cerré ${appName(app, "es")}.`),
    };
  }
  if (app && /\b(enfoca|enfocar|focus|trae|traer|frente|front)\b/.test(t)) {
    return {
      ops: [{ op: "focus", app }],
      reply: () => (en ? `${appName(app, "en")} is in front.` : `${appName(app, "es")} quedó al frente.`),
    };
  }
  if ((app || wantsTasks(t)) && /\b(abri|abre|abrir|open|mostra|mostrar|show|inicia)\b/.test(t)) {
    if (wantsTasks(t) && !app) return { ops: [{ op: "mode", mode: "tasks" }], reply: () => (en ? "Tasks board." : "Tablero de tareas.") };
    if (app) return { ops: [open(app)], reply: () => (en ? `Opened ${appName(app, "en")}.` : `Abrí ${appName(app, "es")}.`) };
  }

  if (/\b(que hay abierto|whats open|what is open|ventanas)\b/.test(t)) {
    return { ops: [], reply: (s) => describeWindows(s, ctx.locale) };
  }
  if (/\b(resumen|summary)\b/.test(t)) {
    if (mentionedApp(t) === "garpen") return { ops: [open("garpen")], reply: (s) => describeApp(s, "garpen", ctx.now, ctx.locale) };
    if (wantsTasks(t)) return { ops: [{ op: "mode", mode: "tasks" }], reply: (s) => describeTasks(s, ctx.locale) };
    if (mentionedApp(t) === "malito" || /\b(mail|correo)\b/.test(t)) return { ops: [open("malito")], reply: (s) => describeApp(s, "malito", ctx.now, ctx.locale) };
    if (mentionedApp(t) === "djtube") return { ops: [open("djtube")], reply: (s) => describeApp(s, "djtube", ctx.now, ctx.locale) };
    return { ops: [open("tarask")], reply: (s) => summarize(s, ctx.now, ctx.locale) };
  }
  if (/\b(contactos|contacts)\b/.test(t)) {
    return {
      ops: [open("garpen")],
      reply: (s) => {
        const names = s.contacts.map((c) => c.name).join(", ");
        return en ? `Contacts: ${names}.` : `Contactos: ${names}.`;
      },
    };
  }
  if (/\bagenda\b/.test(t)) {
    return {
      ops: [open("garpen")],
      reply: (s) => {
        const openItems = s.agenda.filter((a) => !a.done).map((a) => a.title);
        return en ? `Agenda: ${openItems.join(", ") || "empty"}.` : `Agenda: ${openItems.join(", ") || "vacía"}.`;
      },
    };
  }
  if (/\b(deuda|deudas|debt)\b/.test(t)) {
    return {
      ops: [open("tarask")],
      reply: (s) => s.debts.map((d) => `${d.name} ${d.balance} ${d.currency}`).join(", ") || (en ? "No debts." : "Sin deudas."),
    };
  }
  if (/\b(ahorros|savings|reserva)\b/.test(t) && !amountIn(t)) {
    return {
      ops: [open("tarask")],
      reply: (s) => s.savings.map((d) => `${d.name} ${d.current}/${d.target}`).join(", ") || (en ? "No savings goals." : "Sin metas de ahorro."),
    };
  }
  if (/\b(cola|queue)\b/.test(t)) return { ops: [open("djtube")], reply: (s) => describeApp(s, "djtube", ctx.now, ctx.locale) };
  if (/\b(mails?|correo|inbox|sin leer|unread)\b/.test(t)) return { ops: [open("malito")], reply: (s) => describeApp(s, "malito", ctx.now, ctx.locale) };
  if (wantsTasks(t) || /\b(urgentes)\b/.test(t)) return { ops: [{ op: "mode", mode: "tasks" }], reply: (s) => describeTasks(s, ctx.locale) };

  if (/^(que|qué|what|whats|decime|contame|show me)\b/.test(t)) {
    const which = mentionedApp(t) ?? focusedWin(state)?.app;
    if (which) return { ops: [], reply: (s) => describeApp(s, which, ctx.now, ctx.locale) };
    return { ops: [], reply: (s) => describeWindows(s, ctx.locale) };
  }

  const only = mentionedApp(t);
  if (only && t.split(" ").length <= 3) {
    return { ops: [open(only)], reply: () => (en ? `Opened ${appName(only, "en")}.` : `Abrí ${appName(only, "es")}.`) };
  }
  if (findContact(state.contacts, raw) && t.split(" ").length <= 3) {
    const c = findContact(state.contacts, raw)!;
    return { ops: [open("garpen")], reply: () => (en ? `${c.name}, ${c.email || c.company || "no email"}.` : `${c.name}, ${c.email || c.company || "sin mail"}.`) };
  }

  return say(en ? "I didn't get that. Ask for help and I'll show examples." : "No te entendí. Pedime ayuda y te muestro ejemplos.");
}

export function runCommand(text: string, state: DeskState, ctx: CmdCtx): { state: DeskState; reply: string } {
  const planned = plan(text, state, ctx);
  let next = state;
  for (const op of planned.ops) next = applyOp(next, op, ctx);
  const touched = planned.ops.find((op) => (op.op === "open" || op.op === "focus" || op.op === "box") && op.app);
  if (touched && (touched.op === "open" || touched.op === "focus" || touched.op === "box")) {
    next = { ...next, nudge: { app: touched.app, n: (state.nudge?.n ?? 0) + 1 } };
  }
  return { state: next, reply: planned.reply(next) };
}
