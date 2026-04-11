/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { api, mockData } from "../services/api";

const AppContext = createContext();

const initialState = {
  mode: "employee",
  accounts: [],
  transactions: [],
  loans: [],
  branches: [],
  customers: [],
  employees: [],
  payments: mockData.payments,
  autoPayments: mockData.autoPayments,
  categories: mockData.categories,
  monthlyStats: mockData.monthlyStats,
  toast: null,
  loading: false,
  apiOnline: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_MODE":        return { ...state, mode: action.payload };
    case "SET_LOADING":     return { ...state, loading: action.payload };
    case "SET_API_ONLINE":  return { ...state, apiOnline: action.payload };
    case "SHOW_TOAST":      return { ...state, toast: action.payload };
    case "HIDE_TOAST":      return { ...state, toast: null };
    case "SET_ACCOUNTS":    return { ...state, accounts: action.payload };
    case "SET_TRANSACTIONS":return { ...state, transactions: action.payload };
    case "SET_LOANS":       return { ...state, loans: action.payload };
    case "SET_BRANCHES":    return { ...state, branches: action.payload };
    case "SET_CUSTOMERS":   return { ...state, customers: action.payload };
    case "SET_EMPLOYEES":   return { ...state, employees: action.payload };

    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };

    case "REMOVE_ACCOUNT":
      return { ...state, accounts: state.accounts.filter(a => a.accountId !== action.payload) };

    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.payload, ...state.transactions] };

    case "TOGGLE_AUTO_PAYMENT":
      return {
        ...state,
        autoPayments: state.autoPayments.map(p =>
          p.id === action.payload ? { ...p, active: !p.active } : p
        ),
      };

    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const showToast = useCallback((message, type = "success") => {
    dispatch({ type: "SHOW_TOAST", payload: { message, type } });
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    const [accounts, transactions, loans, branches, customers, employees] = await Promise.all([
      api.getAccounts(),
      api.getTransactions(),
      api.getLoans(),
      api.getBranches(),
      api.getCustomers(),
      api.getEmployees(),
    ]);

    const online = accounts !== null;
    dispatch({ type: "SET_API_ONLINE", payload: online });

    dispatch({ type: "SET_ACCOUNTS",     payload: Array.isArray(accounts)     ? accounts     : mockData.accounts });
    dispatch({ type: "SET_TRANSACTIONS", payload: Array.isArray(transactions) ? transactions : mockData.transactions });
    dispatch({ type: "SET_LOANS",        payload: Array.isArray(loans)        ? loans        : mockData.loans });
    dispatch({ type: "SET_BRANCHES",     payload: Array.isArray(branches)     ? branches     : mockData.branches });
    dispatch({ type: "SET_CUSTOMERS",    payload: Array.isArray(customers)    ? customers    : [] });
    dispatch({ type: "SET_EMPLOYEES",    payload: Array.isArray(employees)    ? employees    : [] });

    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  useEffect(() => { loadAll(); }, []);

  const setMode = (m) => dispatch({ type: "SET_MODE", payload: m });

  const addTransaction = useCallback(async (tx) => {
    const result = await api.createTransaction(tx);
    if (result) {
      dispatch({ type: "ADD_TRANSACTION", payload: result });
    }
  }, []);

  const value = { state, dispatch, showToast, loadAll, setMode, addTransaction };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);