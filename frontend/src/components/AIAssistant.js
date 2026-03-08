/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./AIAssistant.css";

const fmt = n => `${Number(n).toLocaleString("ru-KZ")} ₸`;

const TIPS = [
  "Сколько я потратил на еду в этом месяце?",
  "Как я могу сократить расходы?",
  "Когда следующий платёж по кредиту?",
  "Сколько я накоплю за 6 месяцев?",
  "Покажи мои топ-расходы",
];

const analyzeQuery = (q, data) => {
  const lower = q.toLowerCase();
  const { categories, transactions, loans, accounts } = data;

  const food = categories["Еда"]?.amount || 0;
  const transport = categories["Транспорт"]?.amount || 0;
  const totalExpense = Object.values(categories).reduce((s, c) => s + c.amount, 0);
  const income = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const savings = income - totalExpense;
  const topCat = Object.entries(categories).sort((a, b) => b[1].amount - a[1].amount)[0];

  if (lower.includes("еда") || lower.includes("продукт"))
    return `🛒 На еду в марте вы потратили **${fmt(food)}**. Это ${Math.round(food / totalExpense * 100)}% от всех расходов. Рекомендую установить лимит ${fmt(Math.round(food * 0.85))} в следующем месяце — это сэкономит вам около ${fmt(Math.round(food * 0.15))}.`;

  if (lower.includes("транспорт") || lower.includes("такси"))
    return `🚗 На транспорт потрачено **${fmt(transport)}**. Если пользоваться общественным транспортом 2-3 раза в неделю, можно сэкономить до ${fmt(Math.round(transport * 0.4))} в месяц.`;

  if (lower.includes("сократ") || lower.includes("эконом") || lower.includes("оптимиз"))
    return `💡 Анализ ваших расходов показал:\n\n• Наибольшая категория: **${topCat[0]}** — ${fmt(topCat[1].amount)}\n• Подписки: ${fmt(categories["Развлечения"]?.amount || 0)} — можно пересмотреть\n• Рекомендую откладывать 10-15% дохода: около **${fmt(Math.round(income * 0.12))}** в месяц.\n\nПотенциальная экономия: до **${fmt(Math.round(totalExpense * 0.15))}** в месяц.`;

  if (lower.includes("кредит") || lower.includes("платёж") || lower.includes("долг"))
    return `📋 Активных кредитов: **${loans.length}**\n\nОбщий остаток долга: **${fmt(loans.reduce((s, l) => s + l.remaining, 0))}**\n\nСледующие платежи:\n${loans.map(l => `• ${l.type}: ${fmt(l.monthly)} — ближайшее число`).join("\n")}\n\nРекомендую погашать кредиты с наибольшей ставкой в первую очередь.`;

  if (lower.includes("накопл") || lower.includes("сберег") || lower.includes("откладыв"))
    return `💰 Ваши накопления за март:\n\n• Доходы: **${fmt(income)}**\n• Расходы: **${fmt(totalExpense)}**\n• Чистые накопления: **${fmt(savings)}**\n\nЗа 6 месяцев при текущем темпе: **${fmt(savings * 6)}**\n\nСовет: откройте накопительный счёт с доходностью 12-14% — через год это даст дополнительно **${fmt(Math.round(savings * 6 * 0.13))}**.`;

  if (lower.includes("топ") || lower.includes("больш") || lower.includes("расход"))
    return `📊 Топ расходов за март:\n\n${Object.entries(categories)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, { amount, icon }], i) => `${i + 1}. ${icon} **${name}**: ${fmt(amount)} (${Math.round(amount / totalExpense * 100)}%)`)
      .join("\n")}`;

  if (lower.includes("баланс") || lower.includes("счёт") || lower.includes("деньг"))
    return `🏦 Ваши счета:\n\n${accounts.filter(a => a.status === "active").map(a => `• ${a.accountType}: **${fmt(a.balance)}**`).join("\n")}\n\nОбщий баланс: **${fmt(accounts.filter(a => a.status === "active" && a.currency === "KZT").reduce((s, a) => s + a.balance, 0))}**`;

  return `🤖 Я ваш финансовый помощник! Я могу помочь:\n\n• Анализировать расходы по категориям\n• Давать советы по экономии\n• Показывать информацию о кредитах\n• Прогнозировать накопления\n\nПопробуйте спросить: "${TIPS[Math.floor(Math.random() * TIPS.length)]}"`;
};

export default function AIAssistant() {
  const { state } = useApp();
  const { categories, transactions, loans, accounts, monthlyStats } = state;

  const [messages, setMessages] = useState([
    {
      id: 1, role: "assistant",
      text: "👋 Привет! Я ваш личный финансовый помощник FreeDob AI.\n\nЯ анализирую ваши расходы, доходы и могу дать персональные советы по управлению финансами.\n\nЧем могу помочь сегодня?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const totalExpense = Object.values(categories).reduce((s, c) => s + c.amount, 0);
  const income = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const maxBar = Math.max(...monthlyStats.map(m => m.income));

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { id: Date.now(), role: "user", text: q }]);
    setLoading(true);
    setTimeout(() => {
      const reply = analyzeQuery(q, { categories, transactions, loans, accounts });
      setMessages(m => [...m, { id: Date.now() + 1, role: "assistant", text: reply }]);
      setLoading(false);
    }, 800);
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
      return <div key={i} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
    });
  };

  return (
    <div className="ai-page animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">AI Помощник <span style={{ color: "var(--purple)" }}>●</span></h1>
          <p className="section-sub">Персональный финансовый анализ и советы</p>
        </div>
        <div className="ai-badge">🤖 FreeDob AI</div>
      </div>

      <div className="ai-layout">
        {/* CHAT */}
        <div className="ai-chat-panel card">
          <div className="ai-chat-messages" ref={chatRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`ai-msg ai-msg-${msg.role}`}>
                {msg.role === "assistant" && <div className="ai-avatar">🤖</div>}
                <div className={`ai-bubble ai-bubble-${msg.role}`}>{formatText(msg.text)}</div>
                {msg.role === "user" && <div className="ai-avatar ai-user-avatar">👤</div>}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-avatar">🤖</div>
                <div className="ai-bubble ai-bubble-assistant ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* TIPS */}
          <div className="ai-tips">
            {TIPS.map((tip, i) => (
              <button key={i} className="ai-tip-btn" onClick={() => sendMessage(tip)}>{tip}</button>
            ))}
          </div>

          {/* INPUT */}
          <div className="ai-input-row">
            <input
              className="ai-input"
              placeholder="Спросите что-нибудь о финансах..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={!input.trim()}>
              Отправить ↗
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="ai-right">
          {/* DONUT CHART */}
          <div className="card ai-donut-card">
            <div className="table-title" style={{ marginBottom: 16 }}>Структура расходов</div>
            <div className="ai-donut-wrap">
              <svg viewBox="0 0 120 120" className="ai-donut-svg">
                {(() => {
                  let offset = 0;
                  const r = 45, cx = 60, cy = 60;
                  const circ = 2 * Math.PI * r;
                  return Object.entries(categories).map(([name, { amount, color }]) => {
                    const pct = amount / totalExpense;
                    const dash = pct * circ;
                    const el = (
                      <circle key={name} cx={cx} cy={cy} r={r}
                        fill="none" stroke={color} strokeWidth="14"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-offset * circ}
                        style={{ transition: "stroke-dasharray 0.6s" }}>
                        <title>{name}: {fmt(amount)}</title>
                      </circle>
                    );
                    offset += pct;
                    return el;
                  });
                })()}
                <text x="60" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="JetBrains Mono">Расходы</text>
                <text x="60" y="68" textAnchor="middle" fill="#06b6d4" fontSize="8" fontFamily="JetBrains Mono">{fmt(totalExpense)}</text>
              </svg>
              <div className="ai-legend">
                {Object.entries(categories).map(([name, { amount, color, icon }]) => (
                  <div key={name} className="ai-legend-row">
                    <div className="ai-legend-dot" style={{ background: color }} />
                    <span>{icon} {name}</span>
                    <span className="ai-legend-val">{Math.round(amount / totalExpense * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="card">
            <div className="table-title" style={{ marginBottom: 14 }}>Доходы vs Расходы</div>
            <div className="ai-bars">
              {monthlyStats.map((m, i) => {
                const incH = Math.round((m.income / maxBar) * 80);
                const expH = Math.round((m.expense / maxBar) * 80);
                return (
                  <div key={i} className="ai-bar-col">
                    <div className="ai-bar-group">
                      <div className="ai-bar" style={{ height: incH, background: "var(--green)" }} title={fmt(m.income)} />
                      <div className="ai-bar" style={{ height: expH, background: "var(--red)" }} title={fmt(m.expense)} />
                    </div>
                    <div className="ai-bar-label">{m.month}</div>
                  </div>
                );
              })}
            </div>
            <div className="ai-bar-legend">
              <span><span className="ai-dot" style={{ background: "var(--green)" }} />Доходы</span>
              <span><span className="ai-dot" style={{ background: "var(--red)" }} />Расходы</span>
            </div>
          </div>

          {/* TIPS CARD */}
          <div className="card ai-tips-card">
            <div className="table-title" style={{ marginBottom: 14 }}>💡 Советы</div>
            {[
              { icon: "📉", tip: "Сократите расходы на такси — замените 2 поездки в неделю на метро и сэкономьте ~18 000 ₸" },
              { icon: "💳", tip: "Погасите кредит с наибольшей ставкой (18.5%) досрочно — сэкономите на процентах" },
              { icon: "🏦", tip: "Откройте накопительный счёт и переводите 10% зарплаты автоматически" },
            ].map((t, i) => (
              <div key={i} className="ai-tip-item">
                <span className="ai-tip-icon">{t.icon}</span>
                <span className="ai-tip-text">{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}