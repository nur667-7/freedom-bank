import { useApp } from "../context/AppContext";
import "./Dashboard.css";

const fmt = (n, cur = "KZT") => {
  if (cur === "USD") return `$${Number(n).toLocaleString()}`;
  return `${Number(n).toLocaleString("ru-KZ")} ₸`;
};

export default function Dashboard() {
  const { state } = useApp();
  const { accounts, transactions, loans, categories, monthlyStats } = state;

  const totalBalance = accounts
    .filter(a => a.status === "active" && a.currency === "KZT")
    .reduce((s, a) => s + a.balance, 0);

  const thisMonth = transactions
    .filter(t => t.type === "debit" && t.date?.startsWith("2025-03"))
    .reduce((s, t) => s + t.amount, 0);

  const income = transactions
    .filter(t => t.type === "credit" && t.date?.startsWith("2025-03"))
    .reduce((s, t) => s + t.amount, 0);

  const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);

  const maxMonthly = Math.max(...monthlyStats.map(m => m.income));

  return (
    <div className="dashboard animate-in">
      <div className="dash-header">
        <div>
          <h1 className="section-title">Дашборд <span className="dash-dot">●</span></h1>
          <p className="section-sub">Обзор финансовой системы · {new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="dash-greeting">
          <span>Добрый день,</span>
          <span className="dash-name">Нурлан ✦</span>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {[
          { val: fmt(totalBalance), lbl: "Общий баланс", sub: `${accounts.filter(a=>a.status==="active").length} активных счёта`, color: "var(--accent)" },
          { val: fmt(income), lbl: "Доходы за март", sub: "Зарплата + переводы", color: "var(--green)" },
          { val: fmt(thisMonth), lbl: "Расходы за март", sub: `${transactions.filter(t=>t.type==="debit").length} операций`, color: "var(--red)" },
          { val: fmt(totalDebt), lbl: "Долг по кредитам", sub: `${loans.length} активных кредита`, color: "var(--gold)" },
        ].map((s, i) => (
          <div key={i} className="stat-card card-hover" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* ACCOUNTS */}
        <div className="card dash-accounts">
          <div className="table-head" style={{ padding: "0 0 14px" }}>
            <div className="table-title">Мои счета</div>
          </div>
          <div className="accounts-list">
            {accounts.map((a, i) => (
              <div key={a.id} className="acc-row" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="acc-icon" style={{ background: ["rgba(59,130,246,0.15)","rgba(16,185,129,0.15)","rgba(245,158,11,0.15)"][i] }}>
                  {["🏦","💰","💵"][i]}
                </div>
                <div className="acc-info">
                  <div className="acc-type">{a.accountType}</div>
                  <div className="acc-num">{a.accountNumber.slice(-8)}</div>
                </div>
                <div className="acc-balance" style={{ color: ["var(--accent)","var(--green)","var(--gold)"][i] }}>
                  {fmt(a.balance, a.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART */}
        <div className="card dash-chart">
          <div className="table-title" style={{ marginBottom: 16 }}>Доходы / Расходы</div>
          <div className="bar-chart">
            {monthlyStats.map((m, i) => {
              const incH = Math.round((m.income / maxMonthly) * 100);
              const expH = Math.round((m.expense / maxMonthly) * 100);
              return (
                <div key={i} className="bar-col">
                  <div className="bar-group">
                    <div className="bar bar-income" style={{ height: `${incH}%` }} title={fmt(m.income)} />
                    <div className="bar bar-expense" style={{ height: `${expH}%` }} title={fmt(m.expense)} />
                  </div>
                  <div className="bar-label">{m.month}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-dot" style={{ background: "var(--green)" }} />Доходы
            <span className="legend-dot" style={{ background: "var(--red)", marginLeft: 12 }} />Расходы
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="card dash-cats">
          <div className="table-title" style={{ marginBottom: 16 }}>Расходы по категориям</div>
          <div className="cats-list">
            {Object.entries(categories).map(([name, { amount, color, icon }]) => {
              const pct = Math.round((amount / thisMonth) * 100) || 0;
              return (
                <div key={name} className="cat-row">
                  <span className="cat-icon">{icon}</span>
                  <div className="cat-info">
                    <div className="cat-top">
                      <span className="cat-name">{name}</span>
                      <span className="cat-amount">{fmt(amount)}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="card dash-tx">
          <div className="table-title" style={{ marginBottom: 14 }}>Последние операции</div>
          {transactions.slice(0, 6).map((t, i) => (
            <div key={t.id} className="tx-row" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="tx-cat-badge">{state.categories[t.category]?.icon || "💳"}</div>
              <div className="tx-info">
                <div className="tx-desc">{t.description}</div>
                <div className="tx-date">{t.date} · {t.category}</div>
              </div>
              <div className={`tx-amount ${t.type === "credit" ? "tx-in" : "tx-out"}`}>
                {t.type === "credit" ? "+" : "−"}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}