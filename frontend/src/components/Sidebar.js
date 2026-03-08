import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const NAV = [
  { to: "/", label: "Дашборд", icon: "◈", end: true },
  { to: "/accounts", label: "Счета", icon: "🏦" },
  { to: "/payments", label: "Платежи", icon: "💸" },
  { to: "/credits", label: "Кредиты", icon: "📋" },
  { to: "/ai", label: "AI Помощник", icon: "🤖" },
  { to: "/customers", label: "Клиенты", icon: "👥" },
  { to: "/employees", label: "Сотрудники", icon: "👔" },
];

export default function Sidebar() {
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

      <nav className="sb-nav">
        <div className="sb-sec">НАВИГАЦИЯ</div>
        {NAV.slice(0, 5).map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}>
            <span className="sb-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}

        <div className="sb-sec" style={{ marginTop: 16 }}>УПРАВЛЕНИЕ</div>
        {NAV.slice(5).map(n => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}>
            <span className="sb-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-status">
          <span className="status-dot" />
          API · localhost:8080
        </div>
        <div className="sb-version">v1.0.0</div>
      </div>
    </aside>
  );
}