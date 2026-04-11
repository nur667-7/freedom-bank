import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./Sidebar.css";

const NAV_EMPLOYEE = [
  { to: "/",          label: "Дашборд",      icon: "◈", end: true },
  { to: "/customers", label: "Клиенты",      icon: "👥" },
  { to: "/employees", label: "Сотрудники",   icon: "👔" },
  { to: "/accounts",  label: "Счета",        icon: "🏦" },
  { to: "/loans",     label: "Кредиты",      icon: "📋" },
  { to: "/branches",  label: "Филиалы",      icon: "🏢" },
  { to: "/transactions", label: "Транзакции", icon: "💸" },
];

const NAV_CLIENT = [
  { to: "/client",          label: "Мой кабинет",  icon: "◈", end: true },
  { to: "/client/accounts", label: "Мои счета",    icon: "🏦" },
  { to: "/client/payments", label: "Платежи",      icon: "💸" },
  { to: "/client/loans",    label: "Кредиты",      icon: "📋" },
  { to: "/client/ai",       label: "AI Помощник",  icon: "🤖" },
];

export default function Sidebar() {
  const { state, setMode } = useApp();
  const isEmployee = state.mode === "employee";
  const NAV = isEmployee ? NAV_EMPLOYEE : NAV_CLIENT;

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-mark">
          <div className="sb-sym">FB</div>
          <div>
            <div className="sb-name">Free<span>Dob</span></div>
            <div className="sb-tag">Bank System</div>
          </div>
        </div>
      </div>

      {/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ */}
      <div className="mode-switcher">
        <button
          className={mode-btn }
          onClick={() => setMode("employee")}>
          👔 Сотрудник
        </button>
        <button
          className={mode-btn }
          onClick={() => setMode("client")}>
          👤 Клиент
        </button>
      </div>

      <nav className="sb-nav">
        <div className="sb-sec">{isEmployee ? "УПРАВЛЕНИЕ" : "МОИ ФИНАНСЫ"}</div>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => sb-link }>
            <span className="sb-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-status">
          <span className={status-dot } />
          {state.apiOnline ? "API Online" : "Mock данные"}
        </div>
        <div className="sb-version">v1.0.0</div>
      </div>
    </aside>
  );
}