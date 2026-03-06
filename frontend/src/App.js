/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";

const API = "http://localhost:8080/api";

const S = {
  app: { display:"flex", minHeight:"100vh", background:"#0d0f14", color:"#e2e8f0", fontFamily:"sans-serif" },
  sidebar: { width:200, background:"#111318", borderRight:"1px solid #1e2535", padding:"20px 0" },
  logoBox: { padding:"0 20px 20px", borderBottom:"1px solid #1e2535", marginBottom:12 },
  logo: { fontSize:20, fontWeight:700, color:"#3b82f6" },
  logoSub: { fontSize:11, color:"#4a5568", marginTop:2 },
  navBtn: (active) => ({ display:"block", width:"100%", textAlign:"left", padding:"10px 20px", border:"none", background: active ? "rgba(59,130,246,0.15)" : "none", color: active ? "#60a5fa" : "#64748b", fontSize:14, cursor:"pointer", transition:"all .15s" }),
  main: { flex:1, display:"flex", flexDirection:"column" },
  topbar: { padding:"16px 28px", borderBottom:"1px solid #1e2535", background:"#111318", fontSize:18, fontWeight:700 },
  content: { padding:28, flex:1 },
  card: { background:"#161b24", border:"1px solid #1e2535", borderRadius:10, padding:20, marginBottom:20 },
  row: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  title: { fontSize:18, fontWeight:700 },
  btn: (color) => ({ padding:"8px 18px", background: color||"#3b82f6", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500 }),
  btnRed: { padding:"5px 12px", background:"rgba(239,68,68,0.15)", color:"#f87171", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, cursor:"pointer", fontSize:12 },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { textAlign:"left", padding:"10px 14px", fontSize:11, color:"#4a5568", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #1e2535", background:"#0d0f14" },
  td: { padding:"12px 14px", fontSize:13, borderBottom:"1px solid #1a1f2e" },
  form: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  label: { display:"flex", flexDirection:"column", gap:4, fontSize:12, color:"#64748b" },
  input: { padding:"9px 12px", background:"#0d0f14", border:"1px solid #1e2535", borderRadius:8, color:"#e2e8f0", fontSize:13, outline:"none" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  modal: { background:"#161b24", border:"1px solid #1e2535", borderRadius:14, padding:28, width:460 },
  modalTitle: { fontSize:17, fontWeight:700, marginBottom:20 },
  modalFoot: { display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 },
  btnGhost: { padding:"8px 18px", background:"transparent", color:"#64748b", border:"1px solid #1e2535", borderRadius:8, cursor:"pointer", fontSize:13 },
  empty: { textAlign:"center", padding:"40px", color:"#4a5568" },
  err: { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", padding:"12px 16px", borderRadius:8, marginBottom:16, fontSize:13 },
  ok: { background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#34d399", padding:"12px 16px", borderRadius:8, marginBottom:16, fontSize:13 },
  stat: { background:"#161b24", border:"1px solid #1e2535", borderRadius:10, padding:"16px 20px" },
  statGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 },
  statVal: (c) => ({ fontSize:28, fontWeight:700, color: c||"#3b82f6" }),
  statLbl: { fontSize:11, color:"#4a5568", marginTop:3 },
};

// ─── helpers ────────────────────────────────────────────────
function Msg({ text, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={type === "error" ? S.err : S.ok} onClick={onClose}>
      {text}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={S.modalTitle}>{title}</div>
          <button style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer" }} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────
function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ firstName:"", lastName:"", passportNumber:"", phone:"", email:"", address:"", birthDate:"" });

  const notify = (text, type="ok") => setMsg({ text, type });

  const load = () => {
    setLoading(true);
    fetch(`${API}/customers`)
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(data => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        notify("Ошибка загрузки: " + e.message, "error");
        setLoading(false);
      });
  };
useEffect(() => {
  load();
  // eslint-disable-next-line
}, []);

  const handleAdd = () => {
    if (!form.firstName || !form.lastName || !form.passportNumber) {
      notify("Заполните имя, фамилию и паспорт", "error");
      return;
    }
    fetch(`${API}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(() => {
        notify("Клиент добавлен!");
        setModal(false);
        setForm({ firstName:"", lastName:"", passportNumber:"", phone:"", email:"", address:"", birthDate:"" });
        load();
      })
      .catch(e => notify("Ошибка: " + e.message, "error"));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Удалить клиента?")) return;
    fetch(`${API}/customers/${id}`, { method: "DELETE" })
      .then(() => { notify("Удалено"); load(); })
      .catch(e => notify("Ошибка: " + e.message, "error"));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {msg && <Msg text={msg.text} type={msg.type} onClose={() => setMsg(null)} />}

      <div style={S.card}>
        <div style={S.row}>
          <div style={S.title}>👥 Клиенты <span style={{ fontSize:13, color:"#4a5568", fontWeight:400 }}>({list.length})</span></div>
          <button style={S.btn()} onClick={() => setModal(true)}>+ Добавить клиента</button>
        </div>

        {loading ? (
          <div style={S.empty}>Загрузка...</div>
        ) : list.length === 0 ? (
          <div style={S.empty}>Нет клиентов в базе данных</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>ID</th>
                <th style={S.th}>Имя</th>
                <th style={S.th}>Фамилия</th>
                <th style={S.th}>Паспорт</th>
                <th style={S.th}>Телефон</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Дата рег.</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.customerId} onMouseEnter={e => e.currentTarget.style.background="#1a1f2e"} onMouseLeave={e => e.currentTarget.style.background=""}>
                  <td style={{ ...S.td, color:"#4a5568", fontSize:11 }}>{c.customerId}</td>
                  <td style={S.td}>{c.firstName}</td>
                  <td style={S.td}>{c.lastName}</td>
                  <td style={{ ...S.td, color:"#4a5568", fontSize:12 }}>{c.passportNumber}</td>
                  <td style={{ ...S.td, color:"#64748b" }}>{c.phone || "—"}</td>
                  <td style={{ ...S.td, color:"#64748b" }}>{c.email || "—"}</td>
                  <td style={{ ...S.td, color:"#4a5568", fontSize:12 }}>{c.registrationDate || "—"}</td>
                  <td style={S.td}>
                    <button style={S.btnRed} onClick={() => handleDelete(c.customerId)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title="Новый клиент" onClose={() => setModal(false)}>
          <div style={S.form}>
            {[
              ["Имя *", "firstName", "text"],
              ["Фамилия *", "lastName", "text"],
              ["Паспорт *", "passportNumber", "text"],
              ["Телефон", "phone", "text"],
              ["Email", "email", "email"],
              ["Дата рождения", "birthDate", "date"],
            ].map(([label, key, type]) => (
              <label key={key} style={S.label}>
                {label}
                <input style={S.input} type={type} value={form[key]} onChange={e => set(key, e.target.value)} />
              </label>
            ))}
            <label style={{ ...S.label, gridColumn:"1/-1" }}>
              Адрес
              <input style={S.input} value={form.address} onChange={e => set("address", e.target.value)} />
            </label>
          </div>
          <div style={S.modalFoot}>
            <button style={S.btnGhost} onClick={() => setModal(false)}>Отмена</button>
            <button style={S.btn()} onClick={handleAdd}>Сохранить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EMPLOYEES ───────────────────────────────────────────────
function Employees() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ firstName:"", lastName:"", position:"", hireDate:"", salary:"" });

  const notify = (text, type="ok") => setMsg({ text, type });

  const load = () => {
    setLoading(true);
    fetch(`${API}/employees`)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(data => { setList(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(e => { notify("Ошибка загрузки: " + e.message, "error"); setLoading(false); });
  };
useEffect(() => {
  load();
}, [load]);

  const handleAdd = () => {
    if (!form.firstName || !form.lastName) {
      notify("Заполните имя и фамилию", "error");
      return;
    }
    fetch(`${API}/employees/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : null }),
    })
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(() => {
        notify("Сотрудник добавлен!");
        setModal(false);
        setForm({ firstName:"", lastName:"", position:"", hireDate:"", salary:"" });
        load();
      })
      .catch(e => notify("Ошибка: " + e.message, "error"));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Удалить сотрудника?")) return;
    fetch(`${API}/employees/${id}`, { method: "DELETE" })
      .then(() => { notify("Удалено"); load(); })
      .catch(e => notify("Ошибка: " + e.message, "error"));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {msg && <Msg text={msg.text} type={msg.type} onClose={() => setMsg(null)} />}

      <div style={S.card}>
        <div style={S.row}>
          <div style={S.title}>👔 Сотрудники <span style={{ fontSize:13, color:"#4a5568", fontWeight:400 }}>({list.length})</span></div>
          <button style={S.btn("#d97706")} onClick={() => setModal(true)}>+ Принять на работу</button>
        </div>

        {loading ? (
          <div style={S.empty}>Загрузка...</div>
        ) : list.length === 0 ? (
          <div style={S.empty}>Нет сотрудников в базе данных</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>ID</th>
                <th style={S.th}>Имя</th>
                <th style={S.th}>Фамилия</th>
                <th style={S.th}>Должность</th>
                <th style={S.th}>Дата найма</th>
                <th style={S.th}>Зарплата</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(e => {
                const id = e.employeeId || e.id;
                return (
                  <tr key={id} onMouseEnter={ev => ev.currentTarget.style.background="#1a1f2e"} onMouseLeave={ev => ev.currentTarget.style.background=""}>
                    <td style={{ ...S.td, color:"#4a5568", fontSize:11 }}>{id}</td>
                    <td style={S.td}>{e.firstName}</td>
                    <td style={S.td}>{e.lastName}</td>
                    <td style={{ ...S.td, color:"#fbbf24" }}>{e.position || "—"}</td>
                    <td style={{ ...S.td, color:"#64748b" }}>{e.hireDate || "—"}</td>
                    <td style={{ ...S.td, color:"#fbbf24", fontWeight:600 }}>
                      {e.salary ? Number(e.salary).toLocaleString("ru-KZ") + " ₸" : "—"}
                    </td>
                    <td style={S.td}>
                      <button style={S.btnRed} onClick={() => handleDelete(id)}>Удалить</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title="Новый сотрудник" onClose={() => setModal(false)}>
          <div style={S.form}>
            {[
              ["Имя *", "firstName", "text"],
              ["Фамилия *", "lastName", "text"],
              ["Должность", "position", "text"],
              ["Дата найма", "hireDate", "date"],
              ["Зарплата (₸)", "salary", "number"],
            ].map(([label, key, type]) => (
              <label key={key} style={S.label}>
                {label}
                <input style={S.input} type={type} value={form[key]} onChange={e => set(key, e.target.value)} />
              </label>
            ))}
          </div>
          <div style={S.modalFoot}>
            <button style={S.btnGhost} onClick={() => setModal(false)}>Отмена</button>
            <button style={S.btn("#d97706")} onClick={handleAdd}>Сохранить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ customers, employees }) {
  return (
    <div>
      <div style={S.statGrid}>
        {[
          { v: customers.length, l: "Клиентов", c: "#3b82f6" },
          { v: employees.length, l: "Сотрудников", c: "#fbbf24" },
          { v: "—", l: "Счетов", c: "#10b981" },
          { v: "—", l: "Транзакций", c: "#a78bfa" },
        ].map((s, i) => (
          <div key={i} style={S.stat}>
            <div style={S.statVal(s.c)}>{s.v}</div>
            <div style={S.statLbl}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={S.card}>
          <div style={{ ...S.title, marginBottom:14, fontSize:15 }}>Последние клиенты</div>
          {customers.length === 0
            ? <div style={{ color:"#4a5568", fontSize:13 }}>Нет данных</div>
            : customers.slice(0, 5).map(c => (
                <div key={c.customerId} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e2535", fontSize:13 }}>
                  <span>{c.firstName} {c.lastName}</span>
                  <span style={{ color:"#4a5568" }}>{c.registrationDate || "—"}</span>
                </div>
              ))
          }
        </div>
        <div style={S.card}>
          <div style={{ ...S.title, marginBottom:14, fontSize:15 }}>Сотрудники</div>
          {employees.length === 0
            ? <div style={{ color:"#4a5568", fontSize:13 }}>Нет данных</div>
            : employees.slice(0, 5).map(e => (
                <div key={e.employeeId || e.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e2535", fontSize:13 }}>
                  <span>{e.firstName} {e.lastName}</span>
                  <span style={{ color:"#fbbf24" }}>{e.position || "—"}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
const PAGES = [
  { id:"dashboard", label:"🏠 Дашборд" },
  { id:"customers", label:"👥 Клиенты" },
  { id:"employees", label:"👔 Сотрудники" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch(`${API}/customers`).then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/employees`).then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : [])).catch(() => {});
  }, [page]);

  const titles = { dashboard:"Дашборд", customers:"Клиенты", employees:"Сотрудники" };

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logoBox}>
          <div style={S.logo}>FreeDob</div>
          <div style={S.logoSub}>Bank System</div>
        </div>
        <nav>
          {PAGES.map(p => (
            <button key={p.id} style={S.navBtn(page === p.id)} onClick={() => setPage(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"20px", marginTop:"auto", borderTop:"1px solid #1e2535", fontSize:11, color:"#4a5568" }}>
          🟢 API · localhost:8080
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>{titles[page]}</div>
        <div style={S.content}>
          {page === "dashboard" && <Dashboard customers={customers} employees={employees} />}
          {page === "customers" && <Customers />}
          {page === "employees" && <Employees />}
        </div>
      </div>
    </div>
  );
}
;