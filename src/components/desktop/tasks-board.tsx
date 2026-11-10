"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { type Priority, type TaskItem, type TaskStatus } from "@/desktop/model";
import { useDesk } from "@/components/desktop/store";
import { useLocale } from "@/i18n/locale-provider";

const STATUSES: { id: TaskStatus; es: string; en: string; color: string }[] = [
  { id: "todo", es: "Pendiente", en: "To do", color: "#94a3b8" },
  { id: "doing", es: "En curso", en: "In progress", color: "#3b82f6" },
  { id: "review", es: "Revisión", en: "Review", color: "#8b5cf6" },
  { id: "done", es: "Hecho", en: "Done", color: "#22c55e" },
];

const PRIORITIES: { id: Priority; es: string; en: string }[] = [
  { id: "urgent", es: "Urgente", en: "Urgent" },
  { id: "high", es: "Alta", en: "High" },
  { id: "normal", es: "Normal", en: "Normal" },
  { id: "low", es: "Baja", en: "Low" },
];

export function TasksBoard() {
  const { state, dispatch } = useDesk();
  const { locale } = useLocale();
  const en = locale === "en";
  const [listId, setListId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; title: string } | null>(null);
  const [listName, setListName] = useState("");

  const tasks = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.tasks.filter((task) => {
      if (listId !== "all" && task.listId !== listId) return false;
      if (!query) return true;
      return `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase().includes(query);
    });
  }, [state.tasks, listId, q]);

  const open = state.tasks.find((task) => task.id === openId) ?? null;

  const move = (id: string, status: TaskStatus) => {
    dispatch({
      op: "set",
      recipe: (s) => ({ ...s, tasks: s.tasks.map((task) => (task.id === id ? { ...task, status } : task)) }),
    });
  };

  const patch = (id: string, partial: Partial<TaskItem>) => {
    dispatch({
      op: "set",
      recipe: (s) => ({ ...s, tasks: s.tasks.map((task) => (task.id === id ? { ...task, ...partial } : task)) }),
    });
  };

  const onCardPointerDown = (e: ReactPointerEvent<HTMLElement>, task: TaskItem) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select, textarea, a")) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;
    const moveEv = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      dragging = true;
      setGhost({ id: task.id, x: ev.clientX, y: ev.clientY, title: task.title });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", moveEv);
      window.removeEventListener("pointerup", up);
      setGhost(null);
      if (!dragging) {
        setOpenId(task.id);
        return;
      }
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const status = under?.closest("[data-status]")?.getAttribute("data-status") as TaskStatus | null;
      if (status && STATUSES.some((item) => item.id === status)) move(task.id, status);
    };
    window.addEventListener("pointermove", moveEv);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="dk-tasks">
      <aside className="dk-side">
        <button type="button" className={listId === "all" ? "is-on" : ""} onClick={() => setListId("all")}>
          {en ? "All" : "Todas"}
          <em>{state.tasks.length}</em>
        </button>
        {state.lists.map((list) => (
          <button key={list.id} type="button" className={listId === list.id ? "is-on" : ""} onClick={() => setListId(list.id)}>
            <i style={{ background: list.color }} />
            {list.name}
            <em>{state.tasks.filter((task) => task.listId === list.id).length}</em>
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = listName.trim();
            if (!name) return;
            const colors = ["#e2781b", "#3b82f6", "#14b8a6", "#e11d48"];
            dispatch({
              op: "set",
              recipe: (s) => ({
                ...s,
                lists: [...s.lists, { id: crypto.randomUUID(), name, color: colors[s.lists.length % colors.length] }],
              }),
            });
            setListName("");
          }}
        >
          <input value={listName} onChange={(e) => setListName(e.target.value)} placeholder={en ? "New list" : "Nueva lista"} aria-label={en ? "New list" : "Nueva lista"} />
        </form>
      </aside>
      <div className="dk-task-main">
        <header className="dk-task-bar">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? "Search tasks" : "Buscar tareas"} aria-label={en ? "Search tasks" : "Buscar tareas"} />
          <div className="dk-modes">
            <button type="button" className={view === "board" ? "is-on" : ""} onClick={() => setView("board")}>{en ? "Board" : "Tablero"}</button>
            <button type="button" className={view === "list" ? "is-on" : ""} onClick={() => setView("list")}>{en ? "List" : "Lista"}</button>
          </div>
        </header>
        {view === "board" ? (
          <div className="dk-cols">
            {STATUSES.map((col) => {
              const cards = tasks.filter((task) => task.status === col.id);
              return (
                <section key={col.id} className="dk-col" data-status={col.id}>
                  <header>
                    <i style={{ background: col.color }} />
                    {en ? col.en : col.es}
                    <em>{cards.length}</em>
                  </header>
                  {cards.map((task) => (
                    <article key={task.id} className={`dk-task pri-${task.priority}`} onPointerDown={(e) => onCardPointerDown(e, task)}>
                      <strong>{task.title}</strong>
                      <footer>
                        {task.due ? <time>{task.due}</time> : <span />}
                        <Assignee id={task.assigneeId} />
                      </footer>
                    </article>
                  ))}
                  <AddTask en={en} status={col.id} listId={listId === "all" ? state.lists[0]?.id ?? "" : listId} />
                </section>
              );
            })}
          </div>
        ) : (
          <table className="dk-table">
            <thead>
              <tr>
                <th>{en ? "Task" : "Tarea"}</th>
                <th>{en ? "Status" : "Estado"}</th>
                <th>{en ? "Priority" : "Prioridad"}</th>
                <th>{en ? "Due" : "Fecha"}</th>
                <th>{en ? "Assignee" : "Persona"}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} onClick={() => setOpenId(task.id)}>
                  <td>{task.title}</td>
                  <td>{labelStatus(task.status, en)}</td>
                  <td className={`pri-${task.priority}`}>{labelPriority(task.priority, en)}</td>
                  <td>{task.due}</td>
                  <td><Assignee id={task.assigneeId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open ? (
        <aside className="dk-drawer" role="dialog" aria-label={open.title}>
          <header>
            <input value={open.title} aria-label={en ? "Title" : "Título"} onChange={(e) => patch(open.id, { title: e.target.value })} />
            <button type="button" aria-label={en ? "Close" : "Cerrar"} onClick={() => setOpenId(null)}>×</button>
          </header>
          <label>
            {en ? "Description" : "Descripción"}
            <textarea value={open.description} onChange={(e) => patch(open.id, { description: e.target.value })} />
          </label>
          <label>
            {en ? "Status" : "Estado"}
            <select value={open.status} onChange={(e) => patch(open.id, { status: e.target.value as TaskStatus })}>
              {STATUSES.map((col) => (
                <option key={col.id} value={col.id}>{en ? col.en : col.es}</option>
              ))}
            </select>
          </label>
          <label>
            {en ? "Priority" : "Prioridad"}
            <select value={open.priority} onChange={(e) => patch(open.id, { priority: e.target.value as Priority })}>
              {PRIORITIES.map((item) => (
                <option key={item.id} value={item.id}>{en ? item.en : item.es}</option>
              ))}
            </select>
          </label>
          <label>
            {en ? "Due" : "Fecha"}
            <input type="date" value={open.due} onChange={(e) => patch(open.id, { due: e.target.value })} />
          </label>
          <label>
            {en ? "Assignee" : "Persona"}
            <select value={open.assigneeId} onChange={(e) => patch(open.id, { assigneeId: e.target.value })}>
              <option value="">{en ? "Nobody" : "Nadie"}</option>
              {state.contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Tags
            <input value={open.tags.join(", ")} onChange={(e) => patch(open.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </label>
          <label>
            {en ? "List" : "Lista"}
            <select value={open.listId} onChange={(e) => patch(open.id, { listId: e.target.value })}>
              {state.lists.map((list) => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="dk-danger"
            onClick={() => {
              dispatch({ op: "set", recipe: (s) => ({ ...s, tasks: s.tasks.filter((task) => task.id !== open.id) }) });
              setOpenId(null);
            }}
          >
            {en ? "Delete" : "Borrar"}
          </button>
        </aside>
      ) : null}
      {ghost ? (
        <div className="dk-ghost" style={{ left: ghost.x + 8, top: ghost.y + 8 }}>{ghost.title}</div>
      ) : null}
    </div>
  );
}

function AddTask({ en, status, listId }: { en: boolean; status: TaskStatus; listId: string }) {
  const { dispatch } = useDesk();
  const [title, setTitle] = useState("");
  if (!listId) return null;
  return (
    <form
      className="dk-add-task"
      onSubmit={(e) => {
        e.preventDefault();
        const name = title.trim();
        if (!name) return;
        dispatch({
          op: "set",
          recipe: (s) => ({
            ...s,
            tasks: [
              { id: crypto.randomUUID(), listId, title: name, description: "", status, priority: "normal", due: "", assigneeId: "", tags: [] },
              ...s.tasks,
            ],
          }),
        });
        setTitle("");
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={en ? "New task" : "Nueva tarea"} aria-label={en ? "New task" : "Nueva tarea"} />
    </form>
  );
}

function Assignee({ id }: { id: string }) {
  const { state } = useDesk();
  const contact = state.contacts.find((c) => c.id === id);
  if (!contact) return null;
  const initials = contact.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return <span className="dk-avatar" title={contact.name}>{initials}</span>;
}

function labelStatus(id: TaskStatus, en: boolean): string {
  const row = STATUSES.find((item) => item.id === id);
  return row ? (en ? row.en : row.es) : id;
}

function labelPriority(id: Priority, en: boolean): string {
  const row = PRIORITIES.find((item) => item.id === id);
  return row ? (en ? row.en : row.es) : id;
}
