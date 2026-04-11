const API_URL = "http://localhost:8080/api";

export const mockData = {
  accounts: [
    { accountId: 1, accountNumber: "KZ12 3456 7890 1234", accountType: "Текущий", balance: 850000, currency: "KZT", status: "active", openDate: "2022-03-15" },
    { accountId: 2, accountNumber: "KZ98 7654 3210 9876", accountType: "Накопительный", balance: 2400000, currency: "KZT", status: "active", openDate: "2021-08-01" },
    { accountId: 3, accountNumber: "KZ55 1122 3344 5566", accountType: "Валютный", balance: 3200, currency: "USD", status: "active", openDate: "2023-01-10" },
  ],
  transactions: [
    { transactionId: 1, account: { accountId: 1 }, transactionType: "debit", amount: 15000, description: "Супермаркет Magnum", transactionDate: "2025-03-01T10:00:00" },
    { transactionId: 2, account: { accountId: 1 }, transactionType: "credit", amount: 250000, description: "Зарплата за февраль", transactionDate: "2025-03-01T09:00:00" },
    { transactionId: 3, account: { accountId: 1 }, transactionType: "debit", amount: 45000, description: "Такси / Яндекс", transactionDate: "2025-02-28T18:00:00" },
    { transactionId: 4, account: { accountId: 1 }, transactionType: "debit", amount: 8900, description: "Beeline Home", transactionDate: "2025-02-27T12:00:00" },
    { transactionId: 5, account: { accountId: 1 }, transactionType: "debit", amount: 32000, description: "Coffee BOOM", transactionDate: "2025-02-26T14:00:00" },
  ],
  loans: [
    { loanId: 1, loanAmount: 1500000, interestRate: 18.5, startDate: "2023-06-01", endDate: "2026-06-01", status: "active" },
    { loanId: 2, loanAmount: 4500000, interestRate: 14.9, startDate: "2022-01-15", endDate: "2027-01-15", status: "active" },
  ],
  branches: [
    { branchId: 1, branchName: "Главный офис", city: "Алматы", address: "ул. Абая 1", phone: "+7 727 000 00 01" },
    { branchId: 2, branchName: "Алматы-1", city: "Алматы", address: "пр. Достык 5", phone: "+7 727 000 00 02" },
    { branchId: 3, branchName: "Астана", city: "Астана", address: "пр. Туран 10", phone: "+7 717 000 00 03" },
  ],
  payments: [
    { id: 1, name: "Beeline Internet", category: "Интернет", amount: 8900, lastPaid: "2025-02-27" },
    { id: 2, name: "КазМунайГаз", category: "Коммуналка", amount: 12500, lastPaid: "2025-02-20" },
    { id: 3, name: "Netflix", category: "Подписки", amount: 5500, lastPaid: "2025-02-22" },
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

const req = async (url, opts = {}) => {
  try {
    const res = await fetch(${API_URL}, {
      headers: { "Content-Type": "application/json" }, ...opts,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (res.status === 204) return null;
    return await res.json();
  } catch (e) {
    console.warn("API:", e.message);
    return null;
  }
};

export const api = {
  // Customers
  getCustomers:    ()     => req("/customers"),
  createCustomer:  (d)    => req("/customers/register", { method: "POST", body: JSON.stringify(d) }),
  deleteCustomer:  (id)   => req(/customers/, { method: "DELETE" }),

  // Employees
  getEmployees:    ()     => req("/employees"),
  createEmployee:  (d)    => req("/employees/register", { method: "POST", body: JSON.stringify(d) }),
  deleteEmployee:  (id)   => req(/employees/, { method: "DELETE" }),

  // Accounts
  getAccounts:     ()     => req("/accounts"),
  createAccount:   (d)    => req("/accounts", { method: "POST", body: JSON.stringify(d) }),
  updateAccount:   (id,d) => req(/accounts/, { method: "PUT", body: JSON.stringify(d) }),
  deleteAccount:   (id)   => req(/accounts/, { method: "DELETE" }),

  // Branches
  getBranches:     ()     => req("/branches"),
  createBranch:    (d)    => req("/branches", { method: "POST", body: JSON.stringify(d) }),
  deleteBranch:    (id)   => req(/branches/, { method: "DELETE" }),

  // Loans
  getLoans:        ()     => req("/loans"),
  createLoan:      (d)    => req("/loans", { method: "POST", body: JSON.stringify(d) }),
  updateLoan:      (id,d) => req(/loans/, { method: "PUT", body: JSON.stringify(d) }),
  deleteLoan:      (id)   => req(/loans/, { method: "DELETE" }),

  // Transactions
  getTransactions:         ()    => req("/transactions"),
  getTransactionsByAccount:(id)  => req(/transactions/account/),
  createTransaction:       (d)   => req("/transactions", { method: "POST", body: JSON.stringify(d) }),
  deleteTransaction:       (id)  => req(/transactions/, { method: "DELETE" }),
};