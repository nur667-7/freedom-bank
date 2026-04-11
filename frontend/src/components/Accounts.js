/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal, ConfirmModal } from "./Toast";
import "./Accounts.css";

const fmt = (n, cur = "KZT") => cur === "USD" ? `$${Number(n).toLocaleString()}` : `${Number(n).toLocaleString("ru-KZ")} ₸`;

export default function Accounts() {
  const { state, dispatch, showToast, transfer } = useApp();
  const { accounts, transactions } = state;

  const [modal, setModal] = useState(null); // "create" | "transfer" | "history" | "confirm-close"
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [filter, setFilter] = useState({ type: "all", search: "" });
  const [form, setForm] = useState({ accountType: "Текущий", currency: "KZT" });
  const [txForm, setTxForm] = useState({ from: "", to: "", amount: "", desc: "" });
  const [pin, setPin] = useState("");
  const [pinStep, setPinStep] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setTx = (k, v) => setTxForm(f => ({ ...f, [k]: v }));

  const activeAccounts = accounts.filter(a => a.status === "active");

  const handleCreateAccount = () => {
    const newAcc = {
      id: Date.now(),
      accountNumber: `KZ${Math.random().toString().slice(2, 18)}`,
      ...form,
      balance: 0,
      status: "active",
      openDate: new Date().toISOString().split("T")[0],
      branch: "Алматы",
    };
    dispatch({ type: "ADD_ACCOUNT", payload: newAcc });
    showToast("Счёт успешно открыт!", "success");
    setModal(null);
  };

  const handleTransfer = () => {
    if (!txForm.from || !txForm.to || !txForm.amount) {
      showToast("Заполните все поля", "error"); return;
    }
    if (txForm.from === txForm.to) {
      showToast("Нельзя перевести на тот же счёт", "error"); return;
    }
    const fromAcc = accounts.find(a => a.id === Number(txForm.from));
    if (fromAcc.balance < Number(txForm.amount)) {
      showToast("Недостаточно средств", "error"); return;
    }
    setPinStep(true);
  };

  const confirmTransfer = () => {
    if (pin !== "1234") { showToast("Неверный PIN", "error"); return; }
    transfer(Number(txForm.from), Number(txForm.to), Number(txForm.amount), txForm.desc || "Перевод между счетами");
    showToast("Перевод выполнен!", "success");
    setModal(null); setPinStep(false); setPin(""); setTxForm({ from: "", to: "", amount: "", desc: "" });
  };

  const closeAccount = (id) => {
    dispatch({ type: "CLOSE_ACCOUNT", payload: id });
    showToast("Счёт закрыт", "info");
    setModal(null);
  };

  const accTransactions = selectedAcc
    ? transactions.filter(t => t.accountId === selectedAcc.id)
    : [];

  const filteredTx = accTransactions.filter(t => {
    if (filter.type !== "all" && t.type !== filter.type) return false;
    if (filter.search && !t.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="accounts-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Счета <span style={{ color: "var(--cyan)" }}>●</span></h1>
          <p className="section-sub">Управление банковскими счетами</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setModal("transfer")}>⇄ Перевод</button>
          <button className="btn btn-cyan" onClick={() => setModal("create")}>+ Открыть счёт</button>
        </div>
      </div>

      {/* ACCOUNT CARDS */}
      <div className="acc-cards-grid">
        {activeAccounts.map((a, i) => (
          <div key={a.id} className={`acc-bank-card acc-card-${i % 3}`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="acc-card-top">
              <div className="acc-card-type">{a.accountType}</div>
              <div className="acc-card-status">● Активен</div>
            </div>
            <div className="acc-card-balance">{fmt(a.balance, a.currency)}</div>
            <div className="acc-card-num">{a.accountNumber}</div>
            <div className="acc-card-foot">
              <div className="acc-card-date">Открыт: {a.accountDate || a.openDate}</div>
              <div className="acc-card-actions">
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none" }}
                  onClick={() => { setSelectedAcc(a); setModal("history"); }}>
                  История
                </button>
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}
                  onClick={() => { setSelectedAcc(a); setModal("confirm-close"); }}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORY MODAL */}
      {modal === "history" && selectedAcc && (
        <Modal title={`История · ${selectedAcc.accountType}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="search-input" placeholder="Поиск..." value={filter.search}
                onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            </div>
            <select className="form-select" style={{ width: "auto" }} value={filter.type}
              onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="all">Все</option>
              <option value="credit">Пополнения</option>
              <option value="debit">Списания</option>
            </select>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {filteredTx.length === 0
              ? <div className="empty-state"><div className="ei">📭</div><div className="et">Операций нет</div></div>
              : filteredTx.map(t => (
                  <div key={t.id} className="tx-row">
                    <div className="tx-cat-badge">{state.categories[t.category]?.icon || "💳"}</div>
                    <div className="tx-info">
                      <div className="tx-desc">{t.description}</div>
                      <div className="tx-date">{t.date} · {t.category}</div>
                    </div>
                    <div className={`tx-amount ${t.type === "credit" ? "tx-in" : "tx-out"}`}>
                      {t.type === "credit" ? "+" : "−"}{fmt(t.amount)}
                    </div>
                  </div>
                ))
            }
          </div>
        </Modal>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {modal === "create" && (
        <Modal title="Открыть новый счёт" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button>
            <button className="btn btn-cyan" onClick={handleCreateAccount}>Открыть счёт</button>
          </>}>
          <div className="form-grid-2">
            <div className="form-group span-2">
              <label className="form-label">Тип счёта</label>
              <select className="form-select" value={form.accountType} onChange={e => set("accountType", e.target.value)}>
                <option>Текущий</option>
                <option>Накопительный</option>
                <option>Валютный</option>
                <option>Карточный</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Валюта</label>
              <select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option value="KZT">KZT — Тенге</option>
                <option value="USD">USD — Доллар</option>
                <option value="EUR">EUR — Евро</option>
                <option value="RUB">RUB — Рубль</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* TRANSFER MODAL */}
      {modal === "transfer" && (
        <Modal title="Перевод между счетами" onClose={() => { setModal(null); setPinStep(false); setPin(""); }}
          footer={!pinStep ? <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button>
            <button className="btn btn-cyan" onClick={handleTransfer}>Далее →</button>
          </> : <>
            <button className="btn btn-ghost" onClick={() => setPinStep(false)}>Назад</button>
            <button className="btn btn-green" onClick={confirmTransfer}>Подтвердить</button>
          </>}>
          {!pinStep ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Со счёта</label>
                <select className="form-select" value={txForm.from} onChange={e => setTx("from", e.target.value)}>
                  <option value="">Выберите счёт</option>
                  {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.accountType} · {fmt(a.balance, a.currency)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">На счёт</label>
                <select className="form-select" value={txForm.to} onChange={e => setTx("to", e.target.value)}>
                  <option value="">Выберите счёт</option>
                  {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.accountType} · {fmt(a.balance, a.currency)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Сумма (₸)</label>
                <input className="form-input" type="number" placeholder="0" value={txForm.amount} onChange={e => setTx("amount", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <input className="form-input" placeholder="Перевод между счетами" value={txForm.desc} onChange={e => setTx("desc", e.target.value)} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
              <div style={{ fontSize: 14, color: "var(--muted2)", marginBottom: 20 }}>
                Введите PIN для подтверждения перевода<br />
                <strong style={{ color: "var(--text)" }}>{fmt(Number(txForm.amount))}</strong>
              </div>
              <input className="form-input" type="password" placeholder="● ● ● ●" maxLength={4}
                value={pin} onChange={e => setPin(e.target.value)}
                style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, width: 160 }} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Тестовый PIN: 1234</div>
            </div>
          )}
        </Modal>
      )}

      {/* CONFIRM CLOSE */}
      {modal === "confirm-close" && selectedAcc && (
        <ConfirmModal
          message={`Вы уверены что хотите закрыть счёт "${selectedAcc.accountType}"? Это действие нельзя отменить.`}
          confirmText="Закрыть счёт"
          danger
          onConfirm={() => closeAccount(selectedAcc.id)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}