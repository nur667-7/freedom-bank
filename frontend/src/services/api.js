const API_URL = "http://localhost:8080/api";

// ─── MOCK DATA ────────────────────────────────────────────────
export const mockData = {
  accounts: [
    { id: 1, accountNumber: "KZ12 3456 7890 1234", accountType: "Текущий", balance: 850000, currency: "KZT", status: "active", openDate: "2022-03-15", branch: "Алматы" },
    { id: 2, accountNumber: "KZ98 7654 3210 9876", accountType: "Накопительный", balance: 2400000, currency: "KZT", status: "active", openDate: "2021-08-01", branch: "Алматы" },
    { id: 3, accountNumber: "KZ55 1122 3344 5566", accountType: "Валютный", balance: 3200, currency: "USD", status: "active", openDate: "2023-01-10", branch: "Астана" },
  ],

  transactions: [
    { id: 1, accountId: 1, type: "debit", amount: 15000, category: "Еда", description: "Супермаркет Magnum", date: "2025-03-01", balance: 835000 },
    { id: 2, accountId: 1, type: "credit", amount: 250000, category: "Зарплата", description: "Зарплата за февраль", date: "2025-03-01", balance: 1085000 },
    { id: 3, accountId: 1, type: "debit", amount: 45000, category: "Транспорт", description: "Такси / Яндекс", date: "2025-02-28", balance: 835000 },
    { id: 4, accountId: 1, type: "debit", amount: 8900, category: "Интернет", description: "Beeline Home", date: "2025-02-27", balance: 880000 },
    { id: 5, accountId: 1, type: "debit", amount: 32000, category: "Рестораны", description: "Coffee BOOM", date: "2025-02-26", balance: 912000 },
    { id: 6, accountId: 1, type: "debit", amount: 120000, category: "Аренда", description: "Аренда квартиры", date: "2025-02-25", balance: 944000 },
    { id: 7, accountId: 1, type: "credit", amount: 50000, category: "Перевод", description: "Перевод от Данияра", date: "2025-02-24", balance: 1064000 },
    { id: 8, accountId: 1, type: "debit", amount: 22000, category: "Здоровье", description: "Аптека 36.6", date: "2025-02-23", balance: 1014000 },
    { id: 9, accountId: 1, type: "debit", amount: 5500, category: "Развлечения", description: "Netflix", date: "2025-02-22", balance: 1036000 },
    { id: 10, accountId: 1, type: "debit", amount: 18000, category: "Одежда", description: "Lamoda", date: "2025-02-21", balance: 1041500 },
  ],

  loans: [
    { id: 1, type: "Потребительский", amount: 1500000, remaining: 980000, rate: 18.5, monthly: 42000, startDate: "2023-06-01", endDate: "2026-06-01", status: "active", paid: 36, total: 72 },
    { id: 2, type: "Автокредит", amount: 4500000, remaining: 3200000, rate: 14.9, monthly: 105000, startDate: "2022-01-15", endDate: "2027-01-15", status: "active", paid: 26, total: 60 },
  ],

  payments: [
    { id: 1, name: "Beeline Internet", category: "Интернет", amount: 8900, lastPaid: "2025-02-27", saved: true },
    { id: 2, name: "КазМунайГаз", category: "Коммуналка", amount: 12500, lastPaid: "2025-02-20", saved: true },
    { id: 3, name: "Netflix", category: "Подписки", amount: 5500, lastPaid: "2025-02-22", saved: true },
  ],

  autoPayments: [
    { id: 1, name: "Beeline Internet", amount: 8900, day: 27, active: true },
    { id: 2, name: "Netflix", amount: 5500, day: 22, active: true },
  ],

  categories: {
    "Еда": { amount: 45000, color: "#06b6d4", icon: "🛒" },
    "Транспорт": { amount: 45000, color: "#3b82f6", icon: "🚗" },
    "Аренда": { amount: 120000, color: "#a855f7", icon: "🏠" },
    "Рестораны": { amount: 32000, color: "#f59e0b", icon: "☕" },
    "Интернет": { amount: 8900, color: "#10b981", icon: "📡" },
    "Развлечения": { amount: 5500, color: "#ec4899", icon: "🎬" },
    "Здоровье": { amount: 22000, color: "#ef4444", icon: "💊" },
    "Одежда": { amount: 18000, color: "#8b5cf6", icon: "👗" },
  },

  monthlyStats: [
    { month: "Окт", income: 300000, expense: 210000 },
    { month: "Ноя", income: 280000, expense: 195000 },
    { month: "Дек", income: 350000, expense: 280000 },
    { month: "Янв", income: 300000, expense: 220000 },
    { month: "Фев", income: 300000, expense: 256400 },
    { month: "Мар", income: 300000, expense: 180000 },
  ],
};

// ─── API SERVICE ──────────────────────────────────────────────
const request = async (url, options = {}) => {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (res.status === 204) return null;
    return await res.json();
  } catch (e) {
    console.warn("API недоступен, используем mock:", e.message);
    return null;
  }
};

export const api = {
  // Customers
  getCustomers: () => request("/customers"),
  createCustomer: (data) => request("/customers/register", { method: "POST", body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Employees
  getEmployees: () => request("/employees"),
  createEmployee: (data) => request("/employees/register", { method: "POST", body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: "DELETE" }),

  // Mock fallbacks — возвращают mockData если бэк недоступен
  getAccounts: async () => mockData.accounts,
  getTransactions: async () => mockData.transactions,
  getLoans: async () => mockData.loans,
};