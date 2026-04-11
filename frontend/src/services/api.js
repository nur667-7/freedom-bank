const API_URL = "http://localhost:8080/api";

/* =========================
   MOCK DATA (оставил как есть)
========================= */
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
  branches: [
    { branchId: 1, branchName: "Главный офис", city: "Алматы", address: "ул. Абая 1", phone: "+7 727 000 00 01" },
    { branchId: 2, branchName: "Алматы-1", city: "Алматы", address: "пр. Достык 5", phone: "+7 727 000 00 02" },
    { branchId: 3, branchName: "Астана", city: "Астана", address: "пр. Туран 10", phone: "+7 717 000 00 03" },
  ],
};

/* =========================
   REQUEST WRAPPER
========================= */
const req = async (url, opts = {}) => {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...opts,
    });

    if (!res.ok) throw new Error("HTTP " + res.status);
    if (res.status === 204) return null;

    return await res.json();
  } catch (e) {
    console.warn("API error:", e.message);
    return null;
  }
};

/* =========================
   API METHODS
========================= */
export const api = {
  // Customers
  getCustomers: () => req("/customers"),
  createCustomer: (d) =>
    req("/customers/register", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  deleteCustomer: (id) =>
    req(`/customers/${id}`, { method: "DELETE" }),

  // Employees
  getEmployees: () => req("/employees"),
  createEmployee: (d) =>
    req("/employees/register", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  deleteEmployee: (id) =>
    req(`/employees/${id}`, { method: "DELETE" }),

  // Accounts
  getAccounts: () => req("/accounts"),
  createAccount: (d) =>
    req("/accounts", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  updateAccount: (id, d) =>
    req(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(d),
    }),
  deleteAccount: (id) =>
    req(`/accounts/${id}`, { method: "DELETE" }),

  // Branches
  getBranches: () => req("/branches"),
  createBranch: (d) =>
    req("/branches", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  deleteBranch: (id) =>
    req(`/branches/${id}`, { method: "DELETE" }),

  // Loans
  getLoans: () => req("/loans"),
  createLoan: (d) =>
    req("/loans", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  updateLoan: (id, d) =>
    req(`/loans/${id}`, {
      method: "PUT",
      body: JSON.stringify(d),
    }),
  deleteLoan: (id) =>
    req(`/loans/${id}`, { method: "DELETE" }),

  // Transactions
  getTransactions: () => req("/transactions"),
  getTransactionsByAccount: (id) =>
    req(`/transactions/account/${id}`),
  createTransaction: (d) =>
    req("/transactions", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  deleteTransaction: (id) =>
    req(`/transactions/${id}`, { method: "DELETE" }),
};
