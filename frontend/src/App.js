/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Payments from "./components/Payments";
import Credits from "./components/Credits";
import AIAssistant from "./components/AIAssistant";
import { Customers, Employees } from "./components/Management";
import { Toast } from "./components/Toast";
import "./App.css";

function AppInner() {
  const { state } = useApp();
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Sidebar />
        <div className="main-content">
          <div className="page-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
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