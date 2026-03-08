/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal } from "./Toast";
import "./Payments.css";

const fmt = n => `${Number(n).toLocaleString("ru-KZ")} ₸`;

const PAYMENT_CATS = [
  { id: "utility", name: "Коммуналка", icon: "💡", providers: ["КазМунайГаз", "Горводоканал", "ALEL Energo"] },
  { id: "internet", name: "Интернет/ТВ", icon: "📡", providers: ["Beeline", "Kcell", "Altel", "Tele2"] },
  { id: "tax", name: "Налоги/Штрафы", icon: "🏛", providers: ["ИИН-налог", "Штраф ГАИ", "Земельный налог"] },
  { id: "sub", name: "Подписки", icon: "📱", providers: ["Netflix", "Spotify", "YouTube Premium", "Apple One"] },
  { id: "edu", name: "Образование", icon: "📚", providers: ["Казахстанский университет", "Курсы Skillbox"] },
  { id: "other", name: "Другое", icon: "💳", providers: ["Произвольный платёж"] },
];

export default function Payments() {
  const { state, dispatch, showToast, addTransaction } = useApp();
  const { accounts, payments, autoPayments } = state;

  const [modal, setModal] = useState(null);
  const [selCat, setSelCat] = useState(null);
  const [form, setForm] = useState({ provider: "", accountNum: "", amount: "", accId: "" });
  const [history, setHistory] = useState([
    { id: 1, name: "Beeline Internet", amount: 8900, date: "2025-02-27", status: "ok" },
    { id: 2, name: "КазМунайГаз", amount: 12500, date: "2025-02-20", status: "ok" },
    { id: 3, name: "Netflix", amount: 5500, date: "2025-02-22", status: "ok" },
    { id: 4, name: "Netflix", amount: 5500, date: "2025-01-22", status: "ok" },
  ]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePay = () => {
    if (!form.provider || !form.amount || !form.accId) {
      showToast("Заполните все поля", "error"); return;
    }
    const acc = accounts.find(a => a.id === Number(form.accId));
    if (!acc || acc.balance < Number(form.amount)) {
      showToast("Недостаточно средств", "error"); return;
    }
    addTransaction({
      accountId: Number(form.accId),
      type: "debit",
      amount: Number(form.amount),
      category: selCat?.name || "Платёж",
      description: form.provider,
    });
    setHistory(h => [{ id: Date.now(), name: form.provider, amount: Number(form.amount), date: new Date().toISOString().split("T")[0], status: "ok" }, ...h]);
    showToast(`Платёж ${form.provider} выполнен!`, "success");
    setModal(null);
    setForm({ provider: "", accountNum: "", amount: "", accId: "" });
  };

  const repeat = (p) => {
    setSelCat(PAYMENT_CATS.find(c => c.name === p.category) || PAYMENT_CATS[0]);
    setForm({ provider: p.name, accountNum: "", amount: String(p.amount), accId: "" });
    setModal("pay");
  };

  return (
    <div className="payments-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Платежи <span style={{ color: "var(--gold)" }}>●</span></h1>
          <p className="section-sub">Оплата услуг, переводы, шаблоны</p>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="pay-cats-grid">
        {PAYMENT_CATS.map(cat => (
          <div key={cat.id} className="pay-cat-card card card-hover"
            onClick={() => { setSelCat(cat); setForm(f => ({ ...f, provider: cat.providers[0] })); setModal("pay"); }}>
            <div className="pay-cat-icon">{cat.icon}</div>
            <div className="pay-cat-name">{cat.name}</div>
            <div className="pay-cat-sub">{cat.providers.length} провайдеров</div>
          </div>
        ))}
      </div>

      <div className="pay-grid">
        {/* SAVED TEMPLATES */}
        <div className="table-wrap">
          <div className="table-head">
            <div className="table-title">💾 Сохранённые шаблоны</div>
          </div>
          {payments.map(p => (
            <div key={p.id} className="pay-template-row">
              <div className="pay-tmpl-info">
                <div className="pay-tmpl-name">{p.name}</div>
                <div className="pay-tmpl-sub">{p.category} · Последний: {p.lastPaid}</div>
              </div>
              <div className="pay-tmpl-amount">{fmt(p.amount)}</div>
              <button className="btn btn-sm btn-gold" onClick={() => repeat(p)}>Оплатить</button>
            </div>
          ))}
        </div>

        {/* AUTO PAYMENTS */}
        <div className="table-wrap">
          <div className="table-head">
            <div className="table-title">🔄 Автоплатежи</div>
            <button className="btn btn-sm btn-ghost" onClick={() => setModal("auto")}>+ Добавить</button>
          </div>
          {autoPayments.map(p => (
            <div key={p.id} className="pay-auto-row">
              <div className="pay-auto-info">
                <div className="pay-tmpl-name">{p.name}</div>
                <div className="pay-tmpl-sub">Каждое {p.day}-е число</div>
              </div>
              <div className="pay-tmpl-amount">{fmt(p.amount)}</div>
              <div className={`toggle ${p.active ? "on" : ""}`}
                onClick={() => dispatch({ type: "TOGGLE_AUTO_PAYMENT", payload: p.id })}>
                <div className="toggle-dot" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HISTORY */}
      <div className="table-wrap" style={{ marginTop: 20 }}>
        <div className="table-head">
          <div className="table-title">📜 История платежей</div>
        </div>
        <table className="data-table">
          <thead><tr><th>Услуга</th><th>Дата</th><th>Сумма</th><th>Статус</th><th></th></tr></thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 500 }}>{h.name}</td>
                <td style={{ color: "var(--muted2)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{h.date}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt(h.amount)}</td>
                <td><span className="badge badge-green">✓ Оплачено</span></td>
                <td><button className="btn btn-sm btn-ghost" onClick={() => repeat({ name: h.name, amount: h.amount })}>Повторить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAY MODAL */}
      {modal === "pay" && (
        <Modal title={`${selCat?.icon || "💳"} ${selCat?.name || "Платёж"}`} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button>
            <button className="btn btn-gold" onClick={handlePay}>Оплатить</button>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Провайдер</label>
              <select className="form-select" value={form.provider} onChange={e => set("provider", e.target.value)}>
                {(selCat?.providers || []).map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Номер лицевого счёта / ID</label>
              <input className="form-input" placeholder="12345678" value={form.accountNum} onChange={e => set("accountNum", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Сумма (₸)</label>
              <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Списать со счёта</label>
              <select className="form-select" value={form.accId} onChange={e => set("accId", e.target.value)}>
                <option value="">Выберите счёт</option>
                {accounts.filter(a => a.status === "active").map(a =>
                  <option key={a.id} value={a.id}>{a.accountType} · {a.balance.toLocaleString()} {a.currency}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* QR MODAL */}
      {modal === "qr" && (
        <Modal title="QR-сканер" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>📷</div>
            <p style={{ color: "var(--muted2)", fontSize: 13 }}>
              QR-сканер доступен только в мобильной версии.<br />
              Установите приложение для использования камеры.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}