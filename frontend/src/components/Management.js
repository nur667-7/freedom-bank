/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Modal, ConfirmModal } from "./Toast";
import "./Management.css";

const API = "http://localhost:8080/api";

const ini = (f, l) => `${(f || "?")[0]}${(l || "?")[0]}`.toUpperCase();
const PAL = [["#22d3ee","#0c2a35"],["#a78bfa","#1e1035"],["#34d399","#052e16"],["#fb923c","#2d1200"],["#f472b6","#2d0a1e"],["#60a5fa","#0c1f40"]];
const pal = s => PAL[(s || "A").charCodeAt(0) % PAL.length];

async function apiFetch(url, opts = {}) {
  try {
    const r = await fetch(`${API}${url}`, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (r.status === 204) return null;
    return await r.json();
  } catch (e) {
    console.warn("API:", e.message);
    return null;
  }
}

export function Customers() {
  const { showToast } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("cards");
  const [form, setForm] = useState({ firstName: "", lastName: "", passportNumber: "", phone: "", email: "", address: "", birthDate: "" });

  const load = async () => {
    setLoading(true);
    const data = await apiFetch("/customers");
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.firstName || !form.passportNumber) { showToast("Заполните имя и паспорт", "error"); return; }
    const res = await apiFetch("/customers/register", { method: "POST", body: JSON.stringify(form) });
    if (res !== null) { showToast("Клиент добавлен!", "success"); setModal(null); load(); }
    else showToast("Ошибка — проверьте бэкенд", "error");
    setForm({ firstName: "", lastName: "", passportNumber: "", phone: "", email: "", address: "", birthDate: "" });
  };

  const handleDelete = async (id) => {
    await apiFetch(`/customers/${id}`, { method: "DELETE" });
    showToast("Клиент удалён", "info");
    setList(l => l.filter(c => c.customerId !== id));
    setConfirm(null);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filtered = list.filter(c => `${c.firstName} ${c.lastName} ${c.passportNumber} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mgmt-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Клиенты <span style={{ color: "var(--cyan)" }}>●</span></h1>
          <p className="section-sub">Управление базой клиентов · {list.length} записей</p>
        </div>
        <button className="btn btn-cyan" onClick={() => setModal("add")}>+ Новый клиент</button>
      </div>

      {/* STATS */}
      <div className="stats-grid-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { v: list.length, l: "Всего клиентов", c: "var(--cyan)" },
          { v: list.filter(c => c.email).length, l: "С email", c: "var(--green)" },
          { v: list.filter(c => c.phone).length, l: "С телефоном", c: "var(--gold)" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="mgmt-toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="search-input" style={{ width: 280 }} placeholder="Поиск по имени, паспорту, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="view-toggle">
          <button className={`vt-btn ${view === "cards" ? "on" : ""}`} onClick={() => setView("cards")}>⊞</button>
          <button className={`vt-btn ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}>☰</button>
        </div>
      </div>

      {loading ? <div className="empty-state"><div className="ei">⏳</div><div className="et">Загрузка...</div></div>
      : filtered.length === 0 ? <div className="empty-state"><div className="ei">👥</div><div className="et">Клиентов не найдено</div></div>
      : view === "cards" ? (
        <div className="mgmt-cards-grid">
          {filtered.map((c, i) => {
            const [fg, bg] = pal(c.firstName);
            return (
              <div key={c.customerId} className="client-card card card-hover" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="cc-top" style={{ background: `linear-gradient(135deg,${bg}cc,${bg}44)` }}>
                  <div className="cc-avatar" style={{ background: bg, color: fg }}>{ini(c.firstName, c.lastName)}</div>
                </div>
                <div className="cc-body">
                  <div className="cc-name">{c.firstName} {c.lastName}</div>
                  <div className="cc-id">#{c.customerId} · {c.passportNumber}</div>
                  <div className="cc-info">
                    {c.phone && <div className="cc-row">📱 {c.phone}</div>}
                    {c.email && <div className="cc-row">✉ {c.email}</div>}
                    {c.address && <div className="cc-row">📍 {c.address}</div>}
                    {!c.phone && !c.email && <div className="cc-row" style={{ color: "var(--muted)" }}>Нет контактов</div>}
                  </div>
                  <div className="cc-footer">
                    <span className="badge badge-cyan">КЛИЕНТ</span>
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirm(c)}>Удалить</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Клиент</th><th>Паспорт</th><th>Телефон</th><th>Email</th><th>Дата рег.</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const [fg, bg] = pal(c.firstName);
                return (
                  <tr key={c.customerId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, fontFamily: "var(--font-display)", flexShrink: 0 }}>
                          {ini(c.firstName, c.lastName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>#{c.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted2)" }}>{c.passportNumber}</td>
                    <td style={{ color: "var(--muted2)" }}>{c.phone || "—"}</td>
                    <td style={{ color: "var(--muted2)" }}>{c.email || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.registrationDate || "—"}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => setConfirm(c)}>Удалить</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && (
        <Modal title="Новый клиент" onClose={() => setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-cyan" onClick={handleAdd}>Добавить</button></>}>
          <div className="form-grid-2">
            {[["Имя *","firstName"],["Фамилия","lastName"],["Паспорт *","passportNumber"],["Телефон","phone"],["Email","email"]].map(([l, k]) => (
              <div key={k} className="form-group">
                <label className="form-label" style={{ color: "var(--cyan)" }}>{l}</label>
                <input className="form-input" value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--cyan)" }}>Дата рождения</label>
              <input className="form-input" type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} />
            </div>
            <div className="form-group span-2">
              <label className="form-label" style={{ color: "var(--cyan)" }}>Адрес</label>
              <input className="form-input" value={form.address} onChange={e => set("address", e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal message={`Удалить клиента "${confirm.firstName} ${confirm.lastName}"?`}
          confirmText="Удалить" danger onConfirm={() => handleDelete(confirm.customerId)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

export function Employees() {
  const { showToast } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("all");
  const [form, setForm] = useState({ firstName: "", lastName: "", position: "", hireDate: "", salary: "" });

  const load = async () => {
    setLoading(true);
    const data = await apiFetch("/employees");
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName) { showToast("Заполните имя и фамилию", "error"); return; }
    const res = await apiFetch("/employees/register", { method: "POST", body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : null }) });
    if (res !== null) { showToast("Сотрудник принят!", "success"); setModal(null); load(); }
    else showToast("Ошибка — проверьте бэкенд", "error");
    setForm({ firstName: "", lastName: "", position: "", hireDate: "", salary: "" });
  };

  const handleDelete = async (id) => {
    await apiFetch(`/employees/${id}`, { method: "DELETE" });
    showToast("Сотрудник уволен", "info");
    setList(l => l.filter(e => (e.employeeId || e.id) !== id));
    setConfirm(null);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const positions = ["all", ...new Set(list.map(e => e.position).filter(Boolean))];
  const maxSal = Math.max(...list.map(e => +e.salary || 0), 1);
  const avgSal = list.length ? list.reduce((s, e) => s + (+e.salary || 0), 0) / list.length : 0;

  const filtered = list.filter(e => {
    const match = `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(search.toLowerCase());
    const pos = posFilter === "all" || e.position === posFilter;
    return match && pos;
  });

  return (
    <div className="mgmt-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Сотрудники <span style={{ color: "var(--gold)" }}>●</span></h1>
          <p className="section-sub">HR-панель · {list.length} сотрудников</p>
        </div>
        <button className="btn btn-gold" onClick={() => setModal("add")}>+ Принять на работу</button>
      </div>

      <div className="stats-grid">
        {[
          { v: list.length, l: "Всего", c: "var(--gold)" },
          { v: positions.length - 1, l: "Должностей", c: "var(--cyan)" },
          { v: avgSal > 0 ? `${(avgSal / 1000).toFixed(0)}к ₸` : "—", l: "Ср. зарплата", c: "var(--green)" },
          { v: list.filter(e => e.hireDate?.startsWith("2024") || e.hireDate?.startsWith("2025")).length, l: "Новых (с 2024)", c: "var(--purple)" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: "#111308", borderColor: "#2a2005" }}>
            <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-head">
          <div className="table-title" style={{ color: "var(--gold)" }}>▸ СПИСОК СОТРУДНИКОВ</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="search-input" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: "auto", background: "#0d0c02", borderColor: "#2a2005" }}
              value={posFilter} onChange={e => setPosFilter(e.target.value)}>
              {positions.map(p => <option key={p} value={p}>{p === "all" ? "Все должности" : p}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="empty-state"><div className="ei">⏳</div><div className="et">Загрузка...</div></div>
        : filtered.length === 0 ? <div className="empty-state"><div className="ei">👔</div><div className="et">Не найдено</div></div>
        : (
          <table className="data-table">
            <thead><tr><th>Сотрудник</th><th>Должность</th><th>Дата найма</th><th>Зарплата</th><th>Филиал</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => {
                const id = e.employeeId || e.id;
                const sal = +e.salary || 0;
                return (
                  <tr key={id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="emp-avatar">{ini(e.firstName, e.lastName)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.firstName} {e.lastName}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>EMP-{String(id).padStart(4, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {e.position
                        ? <span className="emp-pos-badge">◆ {e.position}</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted2)" }}>📅 {e.hireDate || "—"}</td>
                    <td>
                      {sal > 0 ? (
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--gold)" }}>{sal.toLocaleString("ru-KZ")} ₸</div>
                          <div className="sal-bar-bg"><div className="sal-bar-fill" style={{ width: `${Math.round(sal / maxSal * 100)}%` }} /></div>
                        </div>
                      ) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ color: "var(--muted2)", fontSize: 12 }}>{e.branch?.branchName || "—"}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => setConfirm(e)}>Уволить</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal === "add" && (
        <Modal title="Принять сотрудника" onClose={() => setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-gold" onClick={handleAdd}>Принять</button></>}>
          <div className="form-grid-2">
            {[["Имя *","firstName"],["Фамилия *","lastName"],["Должность","position"],["Зарплата (₸)","salary","number"]].map(([l, k, t]) => (
              <div key={k} className="form-group">
                <label className="form-label" style={{ color: "var(--gold)" }}>{l}</label>
                <input className="form-input" type={t || "text"} value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
            <div className="form-group span-2">
              <label className="form-label" style={{ color: "var(--gold)" }}>Дата найма</label>
              <input className="form-input" type="date" value={form.hireDate} onChange={e => set("hireDate", e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal message={`Уволить "${confirm.firstName} ${confirm.lastName}"?`}
          confirmText="Уволить" danger onConfirm={() => handleDelete(confirm.employeeId || confirm.id)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}