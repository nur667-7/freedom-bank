import { createContext, useContext, useReducer, useCallback } from "react";
import { mockData } from "../services/api";

const AppContext = createContext();

const initialState = {
  accounts: mockData.accounts,
  transactions: mockData.transactions,
  loans: mockData.loans,
  payments: mockData.payments,
  autoPayments: mockData.autoPayments,
  categories: mockData.categories,
  monthlyStats: mockData.monthlyStats,
  toast: null,
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SHOW_TOAST":
      return { ...state, toast: action.payload };

    case "HIDE_TOAST":
      return { ...state, toast: null };

    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };

    case "CLOSE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.payload ? { ...a, status: "closed" } : a
        ),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        accounts: state.accounts.map(a => {
          if (a.id === action.payload.accountId) {
            const delta = action.payload.type === "credit"
              ? action.payload.amount
              : -action.payload.amount;
            return { ...a, balance: a.balance + delta };
          }
          return a;
        }),
      };

    case "PAY_LOAN":
      return {
        ...state,
        loans: state.loans.map(l =>
          l.id === action.payload.loanId
            ? { ...l, remaining: Math.max(0, l.remaining - action.payload.amount), paid: l.paid + 1 }
            : l
        ),
      };

    case "TOGGLE_AUTO_PAYMENT":
      return {
        ...state,
        autoPayments: state.autoPayments.map(p =>
          p.id === action.payload ? { ...p, active: !p.active } : p
        ),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const showToast = useCallback((message, type = "success") => {
    dispatch({ type: "SHOW_TOAST", payload: { message, type } });
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 3500);
  }, []);

  const addTransaction = useCallback((tx) => {
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      balance: 0,
      ...tx,
    };
    dispatch({ type: "ADD_TRANSACTION", payload: newTx });
  }, []);

  const transfer = useCallback((fromId, toId, amount, desc) => {
    addTransaction({ accountId: fromId, type: "debit", amount, category: "Перевод", description: desc || "Перевод" });
    addTransaction({ accountId: toId, type: "credit", amount, category: "Перевод", description: desc || "Перевод" });
  }, [addTransaction]);

  const payLoan = useCallback((loanId, amount, accountId) => {
    dispatch({ type: "PAY_LOAN", payload: { loanId, amount } });
    addTransaction({ accountId, type: "debit", amount, category: "Кредит", description: "Погашение кредита" });
  }, [addTransaction]);

  const value = { state, dispatch, showToast, addTransaction, transfer, payLoan };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);