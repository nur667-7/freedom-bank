/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal } from "./Toast";
import { api } from "../services/api";

const fmt = n => n ? ${Number(n).toLocaleString("ru-KZ")} ₸ : "—";

export default function Transactions() {
  const { state, showToast, loadAll } = useApp();
  const { transactions, accounts } = state;
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ accountId: "", amount: "", transactionType: "debit", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.accountId || !form.amount) { showToast("Заполните все поля", "error"); return; }
    const acc = accounts.find(a => a.accountId === Number(form.accountId));
    if (!acc) { showToast("Счёт не найден", "error"); return; }
    const tx = {
      account: { accountId: Number(form.accountId) },
      amount: parseFloat(form.amount),
      transactionType: form.transactionType,
      description: form.description,
      transactionDate: new Date().toISOString(),
    };
    const res = await api.createTransaction(tx);
    if (res) { showToast("Транзакция добавлена!"); setModal(false); loadAll(); }
    else showToast("Ошибка", "error");
    setForm({ accountId: "", amount: "", transactionType: "debit", description: "" });
  };

  const filtered = transactions.filter(t => {
    const matchType = filter === "all" || t.transactionType === filter;
    const matchSearch = !search || (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const getDate = (t) => {
    const d = t.transactionDate || t.date;
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU");
  };

  const getAccountNum = (t) => {
    if (!t.account) return "—";
    const acc = accounts.find(a => a.accountId === (t.account.accountId || t.account));
    return acc ? acc.accountNumber?.slice(-8) || # : #;
  };

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Транзакции <span style={{ color: "var(--purple)" }}>●</span></h1>
          <p className="section-sub">Все операции · {transactions.length} записей</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Добавить</button>
      </div>

      <div className="table-wrap">
        <div className="table-head">
          <div className="table-title">📜 История операций</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="search-input" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: "auto" }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="credit">Пополнения</option>
              <option value="debit">Списания</option>
            </select>
          </div>
        </div>

        {filtered.length === 0
          ? <div className="empty-state"><div className="ei">💸</div><div className="et">Транзакций нет</div></div>
          : <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Счёт</th><th>Тип</th><th>Сумма</th><th>Описание</th><th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.transactionId || t.id}>
                    <td style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      #{t.transactionId || t.id}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{getAccountNum(t)}</td>
                    <td>
                      <span className={adge }>
                        {(t.transactionType || t.type) === "credit" ? "▲ Приход" : "▼ Расход"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: (t.transactionType || t.type) === "credit" ? "var(--green)" : "var(--red)" }}>
                      {(t.transactionType || t.type) === "credit" ? "+" : "−"}{fmt(t.amount)}
                    </td>
                    <td style={{ color: "var(--muted2)" }}>{t.description || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{getDate(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {modal && (
        <Modal title="Новая транзакция" onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-primary" onClick={handleAdd}>Добавить</button></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Счёт</label>
              <select className="form-select" value={form.accountId} onChange={e => set("accountId", e.target.value)}>
                <option value="">Выберите счёт</option>
                {accounts.map(a => <option key={a.accountId} value={a.accountId}>{a.accountType} · {a.accountNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Тип</label>
              <select className="form-select" value={form.transactionType} onChange={e => set("transactionType", e.target.value)}>
                <option value="debit">Списание</option>
                <option value="credit">Пополнение</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Сумма (₸)</label>
              <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <input className="form-input" placeholder="Описание операции" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}