import { useApp } from "../context/AppContext";
import "./Dashboard.css";

const fmt = (n, cur) => {
  if (!n && n !== 0) return "—";
  if (cur === "USD") return `$${Number(n).toLocaleString()}`;
  return `${Number(n).toLocaleString("ru-KZ")} ₸`;
};

const getType = (t) => t.transactionType || t.type || "";
const getDate = (t) => (t.transactionDate || t.date || "").slice(0, 10);
const getAmt  = (t) => Number(t.amount) || 0;
const getDesc = (t) => t.description || "—";

export default function Dashboard() {
  const { state } = useApp();

  const accounts     = Array.isArray(state.accounts)     ? state.accounts     : [];
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const loans        = Array.isArray(state.loans)        ? state.loans        : [];
  const customers    = Array.isArray(state.customers)    ? state.customers    : [];
  const employees    = Array.isArray(state.employees)    ? state.employees    : [];
  const monthlyStats = Array.isArray(state.monthlyStats) ? state.monthlyStats : [];
  const categories   = state.categories || {};
  const isEmployee   = state.mode === "employee";

  const totalBalance = accounts
    .filter(a => (a.status || "") === "active")
    .reduce((s, a) => s + (Number(a.balance) || 0), 0);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthExpense = transactions
    .filter(t => getType(t) === "debit" && getDate(t).startsWith(monthPrefix))
    .reduce((s, t) => s + getAmt(t), 0);

  const thisMonthIncome = transactions
    .filter(t => getType(t) === "credit" && getDate(t).startsWith(monthPrefix))
    .reduce((s, t) => s + getAmt(t), 0);

  const totalDebt = loans.reduce(
    (s, l) => s + (Number(l.remaining) || Number(l.loanAmount) || 0), 0
  );

  const maxMonthly = Math.max(...monthlyStats.map(m => m.income || 0), 1);

  const ICONS  = ["🏦", "💰", "💵", "🏧"];
  const COLORS = ["var(--accent)", "var(--green)", "var(--gold)", "var(--purple)"];

  const employeeStats = [
    { val: customers.length, lbl: "Клиентов",         sub: "в базе",    color: "var(--cyan)"  },
    { val: employees.length, lbl: "Сотрудников",      sub: "в штате",   color: "var(--gold)"  },
    { val: accounts.filter(a => a.status === "active").length, lbl: "Активных счетов", sub: "открытых", color: "var(--green)" },
    { val: loans.filter(l => l.status === "active").length,    lbl: "Кредитов",        sub: "активных", color: "var(--red)"   },
  ];

  const clientStats = [
    { val: fmt(totalBalance),     lbl: "Общий баланс",     sub: `${accounts.length} счетов`,    color: "var(--accent)" },
    { val: fmt(thisMonthIncome),  lbl: "Доходы",           sub: now.toLocaleString("ru-RU", { month: "long" }), color: "var(--green)" },
    { val: fmt(thisMonthExpense), lbl: "Расходы",          sub: `${transactions.length} операций`, color: "var(--red)" },
    { val: fmt(totalDebt),        lbl: "Долг по кредитам", sub: `${loans.length} кредитов`,     color: "var(--gold)" },
  ];

  const stats = isEmployee ? employeeStats : clientStats;

  return (
    <div className="dashboard animate-in">
      <div className="dash-header">
        <div>
          <h1 className="section-title">
            {isEmployee ? "Панель управления" : "Мой кабинет"}{" "}
            <span className="dash-dot">●</span>
          </h1>
          <p className="section-sub">
            {isEmployee ? "FreeDob Bank — система управления" : "Личный финансовый кабинет"}
            {" · "}
            {now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div
          className="mode-badge"
          style={{
            background: isEmployee ? "rgba(251,191,36,0.12)" : "rgba(6,182,212,0.12)",
            color:      isEmployee ? "var(--gold)"           : "var(--cyan)",
            border:     `1px solid ${isEmployee ? "rgba(251,191,36,0.3)" : "rgba(6,182,212,0.3)"}`,
          }}
        >
          {isEmployee ? "👔 Режим сотрудника" : "👤 Режим клиента"}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div
            key={i}
            className="stat-card card-hover animate-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
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
            <div className="table-title">{isEmployee ? "Все счета" : "Мои счета"}</div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{accounts.length} шт.</span>
          </div>
          <div className="accounts-list">
            {accounts.length === 0
              ? <div className="empty-state"><div className="ei">🏦</div><div className="et">Нет счетов</div></div>
              : accounts.slice(0, 4).map((a, i) => (
                <div
                  key={a.accountId || a.id || i}
                  className="acc-row"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="acc-icon"
                    style={{ background: ["rgba(59,130,246,0.15)", "rgba(16,185,129,0.15)", "rgba(245,158,11,0.15)", "rgba(168,85,247,0.15)"][i % 4] }}
                  >
                    {ICONS[i % 4]}
                  </div>
                  <div className="acc-info">
                    <div className="acc-type">{a.accountType || "Счёт"}</div>
                    <div className="acc-num">{(a.accountNumber || "—").slice(-8)}</div>
                  </div>
                  <div className="acc-balance" style={{ color: COLORS[i % 4] }}>
                    {fmt(a.balance, a.currency)}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* CHART */}
        <div className="card dash-chart">
          <div className="table-title" style={{ marginBottom: 16 }}>Доходы / Расходы</div>
          <div className="bar-chart">
            {monthlyStats.map((m, i) => {
              const incH = Math.round(((m.income || 0) / maxMonthly) * 100);
              const expH = Math.round(((m.expense || 0) / maxMonthly) * 100);
              return (
                <div key={i} className="bar-col">
                  <div className="bar-group">
                    <div className="bar bar-income"  style={{ height: `${incH}%` }} title={fmt(m.income)} />
                    <div className="bar bar-expense" style={{ height: `${expH}%` }} title={fmt(m.expense)} />
                  </div>
                  <div className="bar-label">{m.month}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-dot" style={{ background: "var(--green)" }} /> Доходы
            <span className="legend-dot" style={{ background: "var(--red)", marginLeft: 12 }} /> Расходы
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="card dash-cats">
          <div className="table-title" style={{ marginBottom: 16 }}>Категории расходов</div>
          <div className="cats-list">
            {Object.entries(categories).map(([name, cat]) => {
              const amount = cat?.amount || 0;
              const color  = cat?.color  || "#3b82f6";
              const icon   = cat?.icon   || "💳";
              const pct = thisMonthExpense > 0 ? Math.round((amount / thisMonthExpense) * 100) : 0;
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
          {transactions.length === 0
            ? <div className="empty-state"><div className="ei">💸</div><div className="et">Нет операций</div></div>
            : transactions.slice(0, 6).map((t, i) => {
                const type = getType(t);
                const isIn = type === "credit";
                return (
                  <div
                    key={t.transactionId || t.id || i}
                    className="tx-row"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="tx-cat-badge">{isIn ? "📥" : "📤"}</div>
                    <div className="tx-info">
                      <div className="tx-desc">{getDesc(t)}</div>
                      <div className="tx-date">{getDate(t)}</div>
                    </div>
                    <div className={`tx-amount ${isIn ? "tx-in" : "tx-out"}`}>
                      {isIn ? "+" : "−"}{fmt(getAmt(t))}
                    </div>
                  </div>
                );
              })
          }
        </div>

      </div>
    </div>
  );
}