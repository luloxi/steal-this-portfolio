/**
 * Desktop state: windows, the five apps, and the tasks board.
 * Pure data. The UI and the assistant both go through applyOp.
 */

export type AppId = "djtube" | "garpen" | "tarask" | "malito" | "portfolio";
export type Mode = "desktop" | "tasks";
export type LocaleId = "es" | "en";
export type TxKind = "income" | "expense" | "savings";
export type TaskStatus = "todo" | "doing" | "review" | "done";
export type Priority = "urgent" | "high" | "normal" | "low";
export type AgendaTone = "overdue" | "today" | "soon" | "later" | "done" | "none";

export type Win = {
  id: string;
  app: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; w: number; h: number };
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

export type AgendaItem = {
  id: string;
  title: string;
  due: string;
  done: boolean;
  contactId: string;
  notes: string;
};

export type Account = { id: string; name: string; currency: "ARS" | "USD" };
export type Movement = {
  id: string;
  accountId: string;
  amount: number;
  at: string;
  memo: string;
  contactId: string;
};

export type Timer = {
  running: boolean;
  startedAt: number | null;
  base: number;
  contactId: string;
  rate: number;
  billable: boolean;
};

export type TimeEntry = {
  id: string;
  contactId: string;
  seconds: number;
  rate: number;
  at: string;
  billable: boolean;
  memo: string;
};

export type Track = { videoId: string; title: string; channel: string; thumbnail: string };
export type YtLoad = "a" | "b" | "queue" | null;
export type DjState = {
  queue: Track[];
  results: Track[];
  deckA: string | null;
  deckB: string | null;
  crossfader: number;
  volA: number;
  volB: number;
  playingA: boolean;
  playingB: boolean;
  rateA: number;
  rateB: number;
  request: { n: number; q: string; load: YtLoad } | null;
  note: string;
};

export type Tx = {
  id: string;
  kind: TxKind;
  amount: number;
  currency: "ARS" | "USD";
  at: string;
  memo: string;
  category: string;
};

export type Debt = { id: string; name: string; balance: number; currency: "ARS" | "USD" };
export type Saving = { id: string; name: string; target: number; current: number; currency: "ARS" | "USD" };
export type Member = { id: string; name: string };
export type Household = { id: string; name: string; members: Member[] };
export type SharedExpense = {
  id: string;
  householdId: string;
  payerId: string;
  amount: number;
  memo: string;
  at: string;
  currency: "ARS" | "USD";
};

export type Mail = {
  id: string;
  folder: "inbox" | "sent" | "drafts";
  from: string;
  to: string;
  subject: string;
  body: string;
  at: string;
  read: boolean;
  contactId: string;
};

export type TaskList = { id: string; name: string; color: string };
export type TaskItem = {
  id: string;
  listId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  assigneeId: string;
  tags: string[];
};

export type DeskState = {
  mode: Mode;
  windows: Win[];
  z: number;
  nudge: { app: AppId; n: number } | null;
  contacts: Contact[];
  agenda: AgendaItem[];
  accounts: Account[];
  movements: Movement[];
  timer: Timer;
  entries: TimeEntry[];
  djtube: DjState;
  txs: Tx[];
  debts: Debt[];
  savings: Saving[];
  households: Household[];
  shared: SharedExpense[];
  mail: Mail[];
  lists: TaskList[];
  tasks: TaskItem[];
};

export type CmdCtx = {
  w: number;
  h: number;
  mobile: boolean;
  now: number;
  id: () => string;
  locale: LocaleId;
};

export type Box = "max" | "min" | "left" | "right" | "restore" | { w: number; h: number };

export type Op =
  | { op: "mode"; mode: Mode }
  | { op: "open"; app: AppId }
  | { op: "close"; app: AppId | "all" }
  | { op: "focus"; app: AppId }
  | { op: "box"; app: AppId; box: Box }
  | { op: "clamp" }
  | { op: "yt"; patch: Partial<DjState> }
  | { op: "contactAdd"; name: string; email?: string; phone?: string; company?: string }
  | { op: "agendaAdd"; title: string; due?: string; contactName?: string }
  | { op: "timer"; action: "start" | "stop"; contactName?: string; rate?: number }
  | { op: "movement"; amount: number; memo: string; dir: "in" | "out"; accountName?: string }
  | { op: "tx"; kind: TxKind; amount: number; memo: string; category?: string; currency?: "ARS" | "USD"; at?: string }
  | { op: "debtAdd"; name: string; balance: number; currency?: "ARS" | "USD" }
  | { op: "debtPay"; name: string; amount: number }
  | { op: "savingDeposit"; name: string; amount: number }
  | { op: "houseExpense"; household?: string; payer?: string; amount: number; memo: string; currency?: "ARS" | "USD" }
  | { op: "mailSend"; to: string; subject: string; body: string }
  | { op: "mailRead"; who?: string }
  | { op: "mailReadAll" }
  | { op: "taskAdd"; title: string; list?: string; priority?: Priority; status?: TaskStatus; due?: string }
  | { op: "taskMove"; title: string; status: TaskStatus }
  | { op: "set"; recipe: (s: DeskState) => DeskState };

export const APPS: { id: AppId; icon: string; color: string }[] = [
  { id: "djtube", icon: "/projects/djtube.svg", color: "#ff8a1f" },
  { id: "garpen", icon: "/projects/garpen.v8.png", color: "#14b8a6" },
  { id: "tarask", icon: "/projects/tarask.v2.png", color: "#8b5cf6" },
  { id: "malito", icon: "/projects/malito.v5.png", color: "#3b82f6" },
  { id: "portfolio", icon: "/projects/lulox.v5.png", color: "#e2781b" },
];

export const STORE_KEY = "lulox-desk-v1";

/** Anchor for the first paint so server and client render the same demo day. */
export const FIXED_NOW = Date.UTC(2026, 10, 10, 15);

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/[¿?¡!.,;:()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isoDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKey(ms: number): string {
  return isoDay(ms).slice(0, 7);
}

/** A = min(1, 2*(1-x)), B = min(1, 2*x). Center keeps both decks at full. */
export function transitionGain(x: number): { a: number; b: number } {
  const position = Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
  return { a: Math.min(1, 2 * (1 - position)), b: Math.min(1, 2 * position) };
}

export function parseAmount(raw: string): number | null {
  const m = raw.match(/-?\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  let s = m[0].replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    const parts = s.split(",");
    if (parts[1]?.length === 3 && (parts[0]?.length ?? 0) <= 3 && parts.length === 2) s = s.replace(",", "");
    else s = s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function money(n: number, currency: "ARS" | "USD" = "ARS"): string {
  const formatted = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Math.abs(n));
  const sign = n < 0 ? "-" : "";
  return `${sign}${currency === "USD" ? "US$" : "$"}${formatted}`;
}

export function guessCategory(memo: string): string {
  const t = norm(memo);
  const rules: [RegExp, string][] = [
    [/super|comida|kiosco|resto|restaurant|cafe/, "comida"],
    [/alquiler|expensas|luz|gas|internet|servicio/, "hogar"],
    [/sueldo|cobro|factura|cliente/, "trabajo"],
    [/uber|subte|bondi|nafta|transporte|colectivo/, "transporte"],
    [/farmacia|medico|salud/, "salud"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? "general";
}

export type TicketRead = {
  merchant: string;
  total: number | null;
  date: string | null;
  currency: "ARS" | "USD";
};

export function parseTicket(text: string): TicketRead {
  const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  let merchant = (lines[0] ?? "").replace(/^ticket\s*:\s*/i, "");
  merchant = merchant.replace(/\btotal\b[\s\S]*$/i, "").trim().slice(0, 80) || "Ticket";
  const currency: "ARS" | "USD" = /usd|u\$s|us\$|dolar/.test(norm(text)) ? "USD" : "ARS";
  const dated = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  let date: string | null = null;
  if (dated) {
    const bit = dated[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(bit)) date = bit;
    else {
      const [a, b, c] = bit.split(/[/-]/);
      const year = (c ?? "").length === 2 ? `20${c}` : c;
      if (a && b && year) date = `${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    }
  }
  const totalLine = lines.find((l) => /total/i.test(l)) ?? "";
  let total = totalLine ? parseAmount(totalLine) : null;
  if (total == null) {
    const amounts = lines.map((l) => parseAmount(l)).filter((n): n is number => n != null && n > 0);
    total = amounts.length ? Math.max(...amounts) : null;
  }
  return { merchant, total, date, currency };
}

export function settle(
  members: Member[],
  expenses: { payerId: string; amount: number; memberIds: string[] }[],
): { fromId: string; toId: string; amount: number }[] {
  const net = new Map<string, number>();
  for (const m of members) net.set(m.id, 0);
  for (const e of expenses) {
    const ids = e.memberIds.filter((id) => net.has(id));
    if (!ids.length || !net.has(e.payerId) || !(e.amount > 0)) continue;
    const share = e.amount / ids.length;
    for (const id of ids) net.set(id, (net.get(id) ?? 0) - share);
    net.set(e.payerId, (net.get(e.payerId) ?? 0) + e.amount);
  }
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];
  for (const [id, v] of net) {
    if (v < -0.5) debtors.push({ id, amount: -v });
    else if (v > 0.5) creditors.push({ id, amount: v });
  }
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  const out: { fromId: string; toId: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.5) out.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: Math.round(pay * 100) / 100 });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount <= 0.5) i += 1;
    if (creditors[j].amount <= 0.5) j += 1;
  }
  return out;
}

export function agendaTone(due: string, done: boolean, today: string): AgendaTone {
  if (done) return "done";
  if (!due) return "none";
  if (due < today) return "overdue";
  if (due === today) return "today";
  const later = new Date(`${today}T12:00:00`);
  later.setDate(later.getDate() + 3);
  const cap = isoDay(later.getTime());
  if (due <= cap) return "soon";
  return "later";
}

export function findContact(contacts: Contact[], q: string): Contact | undefined {
  const n = norm(q);
  if (!n) return undefined;
  return (
    contacts.find((c) => norm(c.name) === n) ??
    contacts.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name)))
  );
}

const APP_NAMES: Record<LocaleId, Record<AppId, string>> = {
  es: { djtube: "DjTube", garpen: "Garpen", tarask: "Tarask", malito: "Malito", portfolio: "Portfolio" },
  en: { djtube: "DjTube", garpen: "Garpen", tarask: "Tarask", malito: "Malito", portfolio: "Portfolio" },
};

export function appName(app: AppId, locale: LocaleId): string {
  return APP_NAMES[locale][app];
}

export function focusedWin(state: DeskState): Win | undefined {
  const open = state.windows.filter((w) => !w.minimized);
  return open.reduce<Win | undefined>((best, w) => (!best || w.z > best.z ? w : best), undefined);
}

function emptyDj(): DjState {
  return {
    queue: [],
    results: [],
    deckA: null,
    deckB: null,
    crossfader: 0.5,
    volA: 1,
    volB: 1,
    playingA: false,
    playingB: false,
    rateA: 1,
    rateB: 1,
    request: null,
    note: "",
  };
}

export function seed(now: number): DeskState {
  const today = isoDay(now);
  const yday = isoDay(now - 86400000);
  const soon = isoDay(now + 2 * 86400000);
  const later = isoDay(now + 6 * 86400000);
  return {
    mode: "desktop",
    windows: [],
    z: 1,
    nudge: null,
    contacts: [
      { id: "c-ana", name: "Ana Pérez", email: "ana@estudio-norte.example", phone: "+54 11 5555 0101", company: "Estudio Norte", notes: "Cliente de identidad." },
      { id: "c-mateo", name: "Mateo Ruiz", email: "mateo@example.com", phone: "+54 11 5555 0142", company: "Estudio Norte", notes: "Pide presupuesto el jueves." },
      { id: "c-luz", name: "Luz Vidal", email: "luz@example.com", phone: "", company: "", notes: "Casa." },
    ],
    agenda: [
      { id: "a-1", title: "Entregar propuesta", due: today, done: false, contactId: "c-ana", notes: "Mandar PDF." },
      { id: "a-2", title: "Llamar a Mateo", due: yday, done: false, contactId: "c-mateo", notes: "" },
      { id: "a-3", title: "Revisar contrato", due: soon, done: false, contactId: "c-ana", notes: "" },
      { id: "a-4", title: "Cerrar mes", due: later, done: false, contactId: "", notes: "" },
    ],
    accounts: [
      { id: "ac-caja", name: "Caja", currency: "ARS" },
      { id: "ac-banco", name: "Banco", currency: "ARS" },
      { id: "ac-cobrar", name: "Por cobrar", currency: "ARS" },
    ],
    movements: [
      { id: "mv-1", accountId: "ac-banco", amount: 480000, at: today, memo: "Seña Estudio Norte", contactId: "c-ana" },
      { id: "mv-2", accountId: "ac-caja", amount: -35000, at: yday, memo: "Insumos", contactId: "" },
    ],
    timer: { running: false, startedAt: null, base: 0, contactId: "c-ana", rate: 15000, billable: true },
    entries: [],
    djtube: emptyDj(),
    txs: [
      { id: "tx-1", kind: "income", amount: 1200000, currency: "ARS", at: today, memo: "Sueldo", category: "trabajo" },
      { id: "tx-2", kind: "expense", amount: 450000, currency: "ARS", at: today, memo: "Alquiler", category: "hogar" },
      { id: "tx-3", kind: "expense", amount: 85000, currency: "ARS", at: yday, memo: "Supermercado", category: "comida" },
    ],
    debts: [{ id: "debt-card", name: "Tarjeta", balance: 220000, currency: "ARS" }],
    savings: [{ id: "sav-1", name: "Reserva", target: 500000, current: 180000, currency: "ARS" }],
    households: [
      {
        id: "h-casa",
        name: "Casa",
        members: [
          { id: "me", name: "Vos" },
          { id: "c-luz", name: "Luz" },
        ],
      },
    ],
    shared: [{ id: "sh-1", householdId: "h-casa", payerId: "me", amount: 80000, memo: "Supermercado", at: today, currency: "ARS" }],
    mail: [
      {
        id: "m-1",
        folder: "inbox",
        from: "Ana Pérez",
        to: "vos",
        subject: "Propuesta de identidad",
        body: "Hola. Cuando puedas pasame la propuesta. Si entra esta semana, arrancamos el lunes.",
        at: today,
        read: false,
        contactId: "c-ana",
      },
      {
        id: "m-2",
        folder: "inbox",
        from: "Mateo Ruiz",
        to: "vos",
        subject: "Horario del jueves",
        body: "¿Te queda 11? Si no, el viernes a la mañana.",
        at: yday,
        read: true,
        contactId: "c-mateo",
      },
      {
        id: "m-3",
        folder: "sent",
        from: "vos",
        to: "Luz Vidal",
        subject: "Super",
        body: "Dejé el ticket en Tarask.",
        at: yday,
        read: true,
        contactId: "c-luz",
      },
    ],
    lists: [
      { id: "list-work", name: "Trabajo", color: "#8b5cf6" },
      { id: "list-home", name: "Personal", color: "#14b8a6" },
    ],
    tasks: [
      { id: "t-1", listId: "list-work", title: "Propuesta Estudio Norte", description: "PDF con alcance y precio.", status: "doing", priority: "urgent", due: today, assigneeId: "c-ana", tags: ["cliente"] },
      { id: "t-2", listId: "list-work", title: "Revisar contrato", description: "", status: "review", priority: "high", due: soon, assigneeId: "c-ana", tags: [] },
      { id: "t-3", listId: "list-work", title: "Subir case al portfolio", description: "", status: "todo", priority: "normal", due: later, assigneeId: "", tags: ["portfolio"] },
      { id: "t-4", listId: "list-work", title: "Factura de octubre", description: "", status: "done", priority: "normal", due: yday, assigneeId: "", tags: [] },
      { id: "t-5", listId: "list-home", title: "Comprar café", description: "", status: "todo", priority: "low", due: today, assigneeId: "", tags: ["casa"] },
      { id: "t-6", listId: "list-home", title: "Pagar tarjeta", description: "El resumen está en Tarask.", status: "todo", priority: "high", due: soon, assigneeId: "", tags: ["plata"] },
      { id: "t-7", listId: "list-home", title: "Turno médico", description: "", status: "doing", priority: "normal", due: later, assigneeId: "c-luz", tags: [] },
      { id: "t-8", listId: "list-work", title: "Responder a Mateo", description: "", status: "todo", priority: "urgent", due: yday, assigneeId: "c-mateo", tags: ["mail"] },
    ],
  };
}

function frame(ctx: CmdCtx, index: number): Pick<Win, "x" | "y" | "w" | "h"> {
  if (ctx.mobile) return { x: 0, y: 0, w: Math.max(1, ctx.w), h: Math.max(1, ctx.h) };
  const w = Math.min(920, Math.max(360, ctx.w - 64));
  const h = Math.min(620, Math.max(280, ctx.h - 36));
  const x = Math.max(8, Math.min(20 + (index % 6) * 28, Math.max(8, ctx.w - w - 8)));
  const y = Math.max(8, Math.min(16 + (index % 6) * 24, Math.max(8, ctx.h - h - 8)));
  return { x, y, w, h };
}

function fit(win: Win, ctx: CmdCtx): Win {
  if (ctx.mobile) return { ...win, x: 0, y: 0, w: Math.max(1, ctx.w), h: Math.max(1, ctx.h), maximized: true };
  const w = Math.min(Math.max(280, win.w), Math.max(280, ctx.w));
  const h = Math.min(Math.max(180, win.h), Math.max(180, ctx.h));
  const x = Math.min(Math.max(0, win.x), Math.max(0, ctx.w - Math.min(w, ctx.w)));
  const y = Math.min(Math.max(0, win.y), Math.max(0, ctx.h - Math.min(h, ctx.h)));
  return { ...win, x, y, w: Math.min(w, ctx.w), h: Math.min(h, ctx.h) };
}

function bring(state: DeskState, id: string, patch: Partial<Win> = {}): DeskState {
  const z = state.z + 1;
  return {
    ...state,
    z,
    windows: state.windows.map((w) => (w.id === id ? { ...w, ...patch, z, minimized: patch.minimized ?? false } : w)),
  };
}

export function applyOp(state: DeskState, op: Op, ctx: CmdCtx): DeskState {
  switch (op.op) {
    case "set":
      return op.recipe(state);
    case "mode":
      return { ...state, mode: op.mode };
    case "clamp":
      return { ...state, windows: state.windows.map((w) => fit(w, ctx)) };
    case "open": {
      const existing = state.windows.find((w) => w.app === op.app);
      if (existing) return { ...bring(state, existing.id), mode: "desktop" };
      const z = state.z + 1;
      const win: Win = {
        id: ctx.id(),
        app: op.app,
        ...frame(ctx, state.windows.length),
        z,
        minimized: false,
        maximized: ctx.mobile,
      };
      return { ...state, mode: "desktop", z, windows: [...state.windows, win] };
    }
    case "close":
      if (op.app === "all") return { ...state, windows: [] };
      return { ...state, windows: state.windows.filter((w) => w.app !== op.app) };
    case "focus": {
      const existing = state.windows.find((w) => w.app === op.app);
      if (!existing) return applyOp(state, { op: "open", app: op.app }, ctx);
      return { ...bring(state, existing.id), mode: "desktop" };
    }
    case "box": {
      let next = state.windows.some((w) => w.app === op.app) ? state : applyOp(state, { op: "open", app: op.app }, ctx);
      const win = next.windows.find((w) => w.app === op.app);
      if (!win) return next;
      if (op.box === "min") {
        next = { ...next, windows: next.windows.map((w) => (w.id === win.id ? { ...w, minimized: true } : w)) };
        return next;
      }
      const prev = win.maximized || win.prev ? win.prev ?? { x: win.x, y: win.y, w: win.w, h: win.h } : { x: win.x, y: win.y, w: win.w, h: win.h };
      let rect = { x: win.x, y: win.y, w: win.w, h: win.h };
      let maximized = false;
      if (op.box === "restore") {
        rect = win.prev ?? frame(ctx, 0);
      } else if (op.box === "max" || ctx.mobile) {
        rect = { x: 0, y: 0, w: ctx.w, h: ctx.h };
        maximized = true;
      } else if (op.box === "left") {
        rect = { x: 0, y: 0, w: Math.round(ctx.w / 2), h: ctx.h };
      } else if (op.box === "right") {
        const w = Math.round(ctx.w / 2);
        rect = { x: ctx.w - w, y: 0, w, h: ctx.h };
      } else {
        rect = { ...rect, w: op.box.w, h: op.box.h };
      }
      const fitted = fit({ ...win, ...rect, maximized, prev, minimized: false }, ctx);
      return bring({ ...next, windows: next.windows.map((w) => (w.id === win.id ? fitted : w)) }, win.id, fitted);
    }
    case "yt":
      return { ...state, djtube: { ...state.djtube, ...op.patch } };
    case "contactAdd": {
      const name = op.name.trim().slice(0, 80);
      if (!name) return state;
      const contact: Contact = {
        id: ctx.id(),
        name,
        email: (op.email ?? "").slice(0, 120),
        phone: (op.phone ?? "").slice(0, 40),
        company: (op.company ?? "").slice(0, 80),
        notes: "",
      };
      return { ...state, contacts: [...state.contacts, contact] };
    }
    case "agendaAdd": {
      const title = op.title.trim().slice(0, 140);
      if (!title) return state;
      const contact = op.contactName ? findContact(state.contacts, op.contactName) : undefined;
      const item: AgendaItem = {
        id: ctx.id(),
        title,
        due: op.due || isoDay(ctx.now),
        done: false,
        contactId: contact?.id ?? "",
        notes: "",
      };
      return { ...state, agenda: [item, ...state.agenda] };
    }
    case "timer": {
      if (op.action === "start") {
        const contact = op.contactName ? findContact(state.contacts, op.contactName) : undefined;
        return {
          ...state,
          timer: {
            ...state.timer,
            running: true,
            startedAt: ctx.now,
            contactId: contact?.id ?? state.timer.contactId,
            rate: op.rate && op.rate > 0 ? op.rate : state.timer.rate,
          },
        };
      }
      if (!state.timer.running || !state.timer.startedAt) return { ...state, timer: { ...state.timer, running: false, startedAt: null } };
      const seconds = Math.max(1, Math.round(state.timer.base + (ctx.now - state.timer.startedAt) / 1000));
      const entry: TimeEntry = {
        id: ctx.id(),
        contactId: state.timer.contactId,
        seconds,
        rate: state.timer.rate,
        at: isoDay(ctx.now),
        billable: state.timer.billable,
        memo: "Timer",
      };
      let movements = state.movements;
      if (state.timer.billable) {
        const hours = seconds / 3600;
        movements = [
          {
            id: ctx.id(),
            accountId: "ac-cobrar",
            amount: Math.round(hours * state.timer.rate),
            at: isoDay(ctx.now),
            memo: `Horas ${entry.memo}`,
            contactId: state.timer.contactId,
          },
          ...movements,
        ];
      }
      return {
        ...state,
        entries: [entry, ...state.entries],
        movements,
        timer: { ...state.timer, running: false, startedAt: null, base: 0 },
      };
    }
    case "movement": {
      const account = state.accounts.find((a) => norm(a.name) === norm(op.accountName || "")) ?? state.accounts[0];
      if (!account || !(op.amount > 0)) return state;
      const mv: Movement = {
        id: ctx.id(),
        accountId: account.id,
        amount: op.dir === "out" ? -Math.abs(op.amount) : Math.abs(op.amount),
        at: isoDay(ctx.now),
        memo: op.memo.slice(0, 140) || (op.dir === "out" ? "Egreso" : "Ingreso"),
        contactId: "",
      };
      return { ...state, movements: [mv, ...state.movements] };
    }
    case "tx": {
      if (!(op.amount > 0)) return state;
      const tx: Tx = {
        id: ctx.id(),
        kind: op.kind,
        amount: Math.abs(op.amount),
        currency: op.currency ?? "ARS",
        at: op.at || isoDay(ctx.now),
        memo: op.memo.slice(0, 140) || op.kind,
        category: op.category || guessCategory(op.memo),
      };
      return { ...state, txs: [tx, ...state.txs] };
    }
    case "debtAdd": {
      const name = op.name.trim().slice(0, 80);
      if (!name || !(op.balance > 0)) return state;
      return { ...state, debts: [...state.debts, { id: ctx.id(), name, balance: op.balance, currency: op.currency ?? "ARS" }] };
    }
    case "debtPay": {
      const debt = state.debts.find((d) => norm(d.name).includes(norm(op.name)));
      if (!debt || !(op.amount > 0)) return state;
      const pay = Math.min(debt.balance, op.amount);
      const tx: Tx = {
        id: ctx.id(),
        kind: "expense",
        amount: pay,
        currency: debt.currency,
        at: isoDay(ctx.now),
        memo: `Pago ${debt.name}`,
        category: "deuda",
      };
      return {
        ...state,
        txs: [tx, ...state.txs],
        debts: state.debts.map((d) => (d.id === debt.id ? { ...d, balance: Math.max(0, d.balance - pay) } : d)),
      };
    }
    case "savingDeposit": {
      const goal = state.savings.find((d) => norm(d.name).includes(norm(op.name))) ?? state.savings[0];
      if (!goal || !(op.amount > 0)) return state;
      const tx: Tx = {
        id: ctx.id(),
        kind: "savings",
        amount: op.amount,
        currency: goal.currency,
        at: isoDay(ctx.now),
        memo: goal.name,
        category: "ahorros",
      };
      return {
        ...state,
        txs: [tx, ...state.txs],
        savings: state.savings.map((d) => (d.id === goal.id ? { ...d, current: d.current + op.amount } : d)),
      };
    }
    case "houseExpense": {
      const home = state.households.find((h) => norm(h.name) === norm(op.household || "")) ?? state.households[0];
      if (!home || !(op.amount > 0)) return state;
      const payer = home.members.find((m) => norm(m.name).includes(norm(op.payer || ""))) ?? home.members[0];
      if (!payer) return state;
      const row: SharedExpense = {
        id: ctx.id(),
        householdId: home.id,
        payerId: payer.id,
        amount: op.amount,
        memo: op.memo.slice(0, 140) || "Gasto",
        at: isoDay(ctx.now),
        currency: op.currency ?? "ARS",
      };
      return { ...state, shared: [row, ...state.shared] };
    }
    case "mailSend": {
      const to = op.to.trim().slice(0, 80);
      const subject = op.subject.trim().slice(0, 140) || "(sin asunto)";
      const body = op.body.trim().slice(0, 4000);
      if (!to || !body) return state;
      const contact = findContact(state.contacts, to);
      const mail: Mail = {
        id: ctx.id(),
        folder: "sent",
        from: "vos",
        to: contact?.name ?? to,
        subject,
        body,
        at: isoDay(ctx.now),
        read: true,
        contactId: contact?.id ?? "",
      };
      return { ...state, mail: [mail, ...state.mail] };
    }
    case "mailRead": {
      const inbox = state.mail.filter((m) => m.folder === "inbox");
      const hit = op.who
        ? inbox.find((m) => norm(`${m.from} ${m.subject}`).includes(norm(op.who ?? "")))
        : inbox.find((m) => !m.read) ?? inbox[0];
      if (!hit) return state;
      return { ...state, mail: state.mail.map((m) => (m.id === hit.id ? { ...m, read: true } : m)) };
    }
    case "mailReadAll":
      return { ...state, mail: state.mail.map((m) => ({ ...m, read: true })) };
    case "taskAdd": {
      const title = op.title.trim().slice(0, 160);
      if (!title) return state;
      const list = state.lists.find((l) => norm(l.name) === norm(op.list || "")) ?? state.lists[0];
      if (!list) return state;
      const task: TaskItem = {
        id: ctx.id(),
        listId: list.id,
        title,
        description: "",
        status: op.status ?? "todo",
        priority: op.priority ?? "normal",
        due: op.due ?? "",
        assigneeId: "",
        tags: [],
      };
      return { ...state, tasks: [task, ...state.tasks] };
    }
    case "taskMove": {
      const n = norm(op.title);
      const task = state.tasks.find((t) => norm(t.title) === n) ?? state.tasks.find((t) => norm(t.title).includes(n));
      if (!task) return state;
      return { ...state, tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, status: op.status } : t)) };
    }
    default:
      return state;
  }
}

export function balance(state: DeskState, accountId: string): number {
  return state.movements.filter((m) => m.accountId === accountId).reduce((sum, m) => sum + m.amount, 0);
}

export function monthTx(state: DeskState, now: number): Tx[] {
  const key = monthKey(now);
  return state.txs.filter((t) => t.at.startsWith(key));
}

export function summarize(state: DeskState, now: number, locale: LocaleId): string {
  const rows = monthTx(state, now);
  const income = rows.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const saved = rows.filter((t) => t.kind === "savings").reduce((s, t) => s + t.amount, 0);
  const debt = state.debts.reduce((s, d) => s + d.balance, 0);
  const cats = new Map<string, number>();
  for (const t of rows.filter((r) => r.kind === "expense")) cats.set(t.category, (cats.get(t.category) ?? 0) + t.amount);
  const top = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
  const net = income - expense;
  if (locale === "en") {
    return `This month: income ${money(income)}, expenses ${money(expense)}, net ${money(net)}. Set aside ${money(saved)}. Debt ${money(debt)}.${top ? ` Biggest expense: ${top[0]} (${money(top[1])}).` : ""}`;
  }
  return `Este mes: ingresos ${money(income)}, gastos ${money(expense)}, neto ${money(net)}. Apartado ${money(saved)}. Deuda ${money(debt)}.${top ? ` El gasto más grande es ${top[0]} (${money(top[1])}).` : ""}`;
}

export function describeWindows(state: DeskState, locale: LocaleId): string {
  if (!state.windows.length) return locale === "en" ? "Nothing is open." : "No hay ventanas abiertas.";
  const bits = state.windows.map((w) => {
    const name = appName(w.app, locale);
    if (w.minimized) return locale === "en" ? `${name} (minimized)` : `${name} (minimizada)`;
    return name;
  });
  const front = focusedWin(state);
  const head = locale === "en" ? "Open" : "Abiertas";
  const focus = front ? (locale === "en" ? ` Front: ${appName(front.app, locale)}.` : ` Al frente: ${appName(front.app, locale)}.`) : "";
  return `${head}: ${bits.join(", ")}.${focus}`;
}

export function describeApp(state: DeskState, app: AppId, now: number, locale: LocaleId): string {
  const en = locale === "en";
  if (app === "djtube") {
    const a = state.djtube.queue.find((t) => t.videoId === state.djtube.deckA);
    const b = state.djtube.queue.find((t) => t.videoId === state.djtube.deckB);
    const gain = transitionGain(state.djtube.crossfader);
    return en
      ? `DjTube queue: ${state.djtube.queue.length}. Deck A: ${a?.title ?? "empty"}. Deck B: ${b?.title ?? "empty"}. Fader A ${Math.round(gain.a * 100)} / B ${Math.round(gain.b * 100)}.`
      : `Cola de DjTube: ${state.djtube.queue.length}. Deck A: ${a?.title ?? "vacío"}. Deck B: ${b?.title ?? "vacío"}. Fader A ${Math.round(gain.a * 100)} / B ${Math.round(gain.b * 100)}.`;
  }
  if (app === "garpen") {
    const today = isoDay(now);
    const next = state.agenda.find((a) => !a.done && agendaTone(a.due, false, today) !== "done");
    const open = state.agenda.filter((a) => !a.done).length;
    const timer = state.timer.running ? (en ? "Timer running." : "El timer está corriendo.") : en ? "Timer stopped." : "El timer está quieto.";
    const cuentas = state.accounts.map((a) => `${a.name} ${money(balance(state, a.id), a.currency)}`).join(", ");
    return en
      ? `Garpen: ${state.contacts.length} contacts, ${open} open agenda items.${next ? ` Next: ${next.title}.` : ""} ${timer} Accounts: ${cuentas}.`
      : `Garpen: ${state.contacts.length} contactos, ${open} pendientes en la agenda.${next ? ` Siguiente: ${next.title}.` : ""} ${timer} Cuentas: ${cuentas}.`;
  }
  if (app === "tarask") return summarize(state, now, locale);
  if (app === "malito") {
    const unread = state.mail.filter((m) => m.folder === "inbox" && !m.read);
    const latest = state.mail.find((m) => m.folder === "inbox");
    return en
      ? `Malito: ${unread.length} unread.${latest ? ` Latest: ${latest.subject} (${latest.from}).` : ""}`
      : `Malito: ${unread.length} sin leer.${latest ? ` El último: ${latest.subject} (${latest.from}).` : ""}`;
  }
  return en ? "Portfolio is the site, inside the window." : "Portfolio es el sitio, adentro de la ventana.";
}

export function describeTasks(state: DeskState, locale: LocaleId): string {
  const count = (status: TaskStatus) => state.tasks.filter((t) => t.status === status).length;
  const urgent = state.tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;
  if (locale === "en") {
    return `Tasks: ${count("todo")} to do, ${count("doing")} in progress, ${count("review")} in review, ${count("done")} done. Urgent open: ${urgent}.`;
  }
  return `Tareas: ${count("todo")} pendientes, ${count("doing")} en curso, ${count("review")} en revisión, ${count("done")} hechas. Urgentes abiertas: ${urgent}.`;
}

function isWin(value: unknown): value is Win {
  if (!value || typeof value !== "object") return false;
  const w = value as Win;
  return typeof w.id === "string" && typeof w.app === "string" && typeof w.x === "number";
}

export function hydrate(raw: unknown, now: number): DeskState | null {
  if (!raw || typeof raw !== "object") return null;
  const base = seed(now);
  const r = raw as Partial<DeskState>;
  const pick = <T,>(value: T[] | undefined, fallback: T[]): T[] => (Array.isArray(value) ? value : fallback);
  try {
    return {
      ...base,
      mode: r.mode === "tasks" ? "tasks" : "desktop",
      windows: pick(r.windows, []).filter(isWin),
      z: typeof r.z === "number" ? r.z : 1,
      nudge: null,
      contacts: pick(r.contacts, base.contacts),
      agenda: pick(r.agenda, base.agenda),
      accounts: pick(r.accounts, base.accounts),
      movements: pick(r.movements, base.movements),
      timer: r.timer && typeof r.timer === "object" ? { ...base.timer, ...r.timer, running: false, startedAt: null } : base.timer,
      entries: pick(r.entries, []),
      djtube: r.djtube && typeof r.djtube === "object" ? { ...base.djtube, ...r.djtube, request: null, playingA: false, playingB: false } : base.djtube,
      txs: pick(r.txs, base.txs),
      debts: pick(r.debts, base.debts),
      savings: pick(r.savings, base.savings),
      households: pick(r.households, base.households),
      shared: pick(r.shared, base.shared),
      mail: pick(r.mail, base.mail),
      lists: pick(r.lists, base.lists),
      tasks: pick(r.tasks, base.tasks),
    };
  } catch {
    return null;
  }
}

export function readStore(now: number): DeskState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return hydrate(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

export function writeStore(state: DeskState) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, nudge: null }));
  } catch {
    /* quota or private mode */
  }
}
