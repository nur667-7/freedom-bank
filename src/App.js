/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Payments from "./components/Payments";
import Credits from "./components/Credits";
import AIAssistant from "./components/AIAssistant";
import { Customers, Employees } from "./components/Management";
import Branches from "./components/Branches";
import Transactions from "./components/Transactions";
import { Toast } from "./components/Toast";
import "./App.css";

function AppInner() {
  const { state } = useApp();
  const isEmployee = state.mode === "employee";

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Sidebar />
        <div className="main-content">
          <div className="page-area">
            <Routes>
              {/* РЕЖИМ СОТРУДНИКА */}
              {isEmployee && <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/loans" element={<Credits />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/transactions" element={<Transactions />} />
              </>}

              {/* РЕЖИМ КЛИЕНТА */}
              {!isEmployee && <>
                <Route path="/client" element={<Dashboard />} />
                <Route path="/client/accounts" element={<Accounts />} />
                <Route path="/client/payments" element={<Payments />} />
                <Route path="/client/loans" element={<Credits />} />
                <Route path="/client/ai" element={<AIAssistant />} />
              </>}

              {/* РЕДИРЕКТЫ */}
              <Route path="*" element={<Navigate to={isEmployee ? "/" : "/client"} />} />
            </Routes>
          </div>
        </div>
        <Toast toast={state.toast} />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}