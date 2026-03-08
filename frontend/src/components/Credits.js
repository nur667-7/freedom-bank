/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal } from "./Toast";
import "./Credits.css";

const fmt = n => `${Number(n).toLocaleString("ru-KZ")} ₸`;

export default function Credits() {
  const { state, showToast, payLoan } = useApp();
  const { loans, accounts } = state;

  const [modal, setModal] = useState(null);
  const [selLoan, setSelLoan] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", accId: "", full: false });
  const [calc, setCalc] = useState({ amount: 1000000, rate: 18, term: 12 });
  const [appForm, setAppForm] = useState({ type: "Потребительский", income: "", purpose: "" });
  const [submitted, setSubmitted] = useState(false);

  const monthly = (() => {
    const r = calc.rate / 100 / 12;
    const n = calc.term;
    const p = calc.amount;
    if (r === 0) return p / n;
    return Math.round(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  })();

  const totalPay = monthly * calc.term;
  const overpay = totalPay - calc.amount;

  const handlePay = () => {
    if (!payForm.accId || !payForm.amount) { showToast("Заполните все поля", "error"); return; }
    const acc = accounts.find(a => a.id === Number(payForm.accId));
    if (!acc || acc.balance < Number(payForm.amount)) { showToast("Недостаточно средств", "error"); return; }
    payLoan(selLoan.id, Number(payForm.amount), Number(payForm.accId));
    showToast("Кредит частично погашен!", "success");
    setModal(null);
  };

  const handleApply = () => {
    if (!appForm.income) { showToast("Укажите доход", "error"); return; }
    setSubmitted(true);
    showToast("Заявка отправлена! Решение в течение 24 часов.", "success");
    setTimeout(() => { setModal(null); setSubmitted(false); }, 2000);
  };

  return (
    <div className="credits-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Кредиты <span style={{ color: "var(--purple)" }}>●</span></h1>
          <p className="section-sub">Активные кредиты и новые заявки</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("apply")}>+ Новая заявка</button>
      </div>

      {/* ACTIVE LOANS */}
      <div className="loans-grid">
        {loans.map((loan, i) => {
          const pct = Math.round((loan.paid / loan.total) * 100);
          return (
            <div key={loan.id} className="loan-card card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="loan-header">
                <div>
                  <div className="loan-type">{loan.type}</div>
                  <div className="loan-rate">{loan.rate}% годовых</div>
                </div>
                <span className="badge badge-green">Активен</span>
              </div>

              <div className="loan-amounts">
                <div className="loan-remaining">
                  <div className="loan-amount-val">{fmt(loan.remaining)}</div>
                  <div className="loan-amount-lbl">Остаток долга</div>
                </div>
                <div className="loan-monthly">
                  <div className="loan-amount-val" style={{ color: "var(--gold)" }}>{fmt(loan.monthly)}</div>
                  <div className="loan-amount-lbl">Ежемесячный платёж</div>
                </div>
              </div>

              <div className="loan-progress">
                <div className="loan-progress-info">
                  <span>Погашено {loan.paid}/{loan.total} платежей</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: "var(--purple)" }} />
                </div>
              </div>

              <div className="loan-dates">
                <span>📅 {loan.startDate}</span>
                <span>→</span>
                <span>{loan.endDate}</span>
              </div>

              {/* SCHEDULE */}
              <div className="loan-schedule">
                {Array.from({ length: Math.min(loan.total, 12) }).map((_, j) => (
                  <div key={j} className={`schedule-dot ${j < loan.paid ? "paid" : j === loan.paid ? "current" : ""}`}
                    title={`Платёж ${j + 1}`} />
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}
                  onClick={() => { setSelLoan(loan); setPayForm({ amount: String(loan.monthly), accId: "", full: false }); setModal("pay"); }}>
                  Оплатить
                </button>
                <button className="btn btn-sm btn-primary" style={{ flex: 1 }}
                  onClick={() => { setSelLoan(loan); setPayForm({ amount: String(loan.remaining), accId: "", full: true }); setModal("pay"); }}>
                  Погасить полностью
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CALCULATOR */}
      <div className="card calc-card">
        <div className="table-title" style={{ marginBottom: 20 }}>🧮 Кредитный калькулятор</div>
        <div className="calc-grid">
          <div className="calc-inputs">
            {[
              { label: "Сумма кредита (₸)", key: "amount", min: 100000, max: 50000000, step: 50000 },
              { label: `Процентная ставка: ${calc.rate}%`, key: "rate", min: 1, max: 50, step: 0.5 },
              { label: `Срок: ${calc.term} мес.`, key: "term", min: 1, max: 120, step: 1 },
            ].map(({ label, key, min, max, step }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                {key === "amount"
                  ? <input className="form-input" type="number" value={calc.amount}
                      onChange={e => setCalc(c => ({ ...c, amount: Number(e.target.value) }))} />
                  : <input type="range" min={min} max={max} step={step} value={calc[key]}
                      onChange={e => setCalc(c => ({ ...c, [key]: Number(e.target.value) }))}
                      className="calc-range" />
                }
              </div>
            ))}
          </div>
          <div className="calc-result">
            <div className="calc-res-main">
              <div className="calc-res-val">{fmt(monthly)}</div>
              <div className="calc-res-lbl">Ежемесячный платёж</div>
            </div>
            <div className="calc-res-rows">
              <div className="calc-res-row">
                <span>Сумма кредита</span>
                <span>{fmt(calc.amount)}</span>
              </div>
              <div className="calc-res-row">
                <span>Переплата</span>
                <span style={{ color: "var(--red)" }}>{fmt(overpay)}</span>
              </div>
              <div className="calc-res-row">
                <span>Итого к выплате</span>
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>{fmt(totalPay)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 16 }}
              onClick={() => setModal("apply")}>
              Подать заявку →
            </button>
          </div>
        </div>
      </div>

      {/* PAY MODAL */}
      {modal === "pay" && selLoan && (
        <Modal title={`Погашение · ${selLoan.type}`} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={handlePay}>Оплатить</button>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Сумма погашения (₸)</label>
              <input className="form-input" type="number" value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Остаток: {fmt(selLoan.remaining)} · Ежемесячный: {fmt(selLoan.monthly)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Списать со счёта</label>
              <select className="form-select" value={payForm.accId}
                onChange={e => setPayForm(f => ({ ...f, accId: e.target.value }))}>
                <option value="">Выберите счёт</option>
                {accounts.filter(a => a.status === "active").map(a =>
                  <option key={a.id} value={a.id}>{a.accountType} · {a.balance.toLocaleString()} {a.currency}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* APPLY MODAL */}
      {modal === "apply" && (
        <Modal title="Заявка на кредит" onClose={() => setModal(null)}
          footer={!submitted ? <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={handleApply}>Отправить заявку</button>
          </> : null}>
          {submitted
            ? <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Заявка отправлена!</div>
                <div style={{ fontSize: 13, color: "var(--muted2)", marginTop: 6 }}>Решение в течение 24 часов</div>
              </div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Тип кредита</label>
                  <select className="form-select" value={appForm.type}
                    onChange={e => setAppForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Потребительский</option>
                    <option>Автокредит</option>
                    <option>Ипотека</option>
                    <option>Бизнес-кредит</option>
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Сумма (₸)</label>
                    <input className="form-input" type="number" value={calc.amount} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Срок (мес.)</label>
                    <input className="form-input" type="number" value={calc.term} readOnly style={{ opacity: 0.7 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Ежемесячный доход (₸)</label>
                  <input className="form-input" type="number" placeholder="300000" value={appForm.income}
                    onChange={e => setAppForm(f => ({ ...f, income: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Цель кредита</label>
                  <input className="form-input" placeholder="Покупка автомобиля" value={appForm.purpose}
                    onChange={e => setAppForm(f => ({ ...f, purpose: e.target.value }))} />
                </div>
              </div>
          }
        </Modal>
      )}
    </div>
  );
}