/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Smartphone,
  ShieldAlert,
  Sliders,
  Wallet,
  Coins,
  FileSpreadsheet,
  Users,
  ChevronRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  Database,
  RefreshCw,
  Cloud
} from "lucide-react";
import { loadSystemState, saveSystemState, SystemState } from "./utils/state";
import FintechSimulator from "./components/FintechSimulator";
import LoanOrigination from "./components/LoanOrigination";
import StaffConsole from "./components/StaffConsole";

export default function App() {
  const [state, setState] = useState<SystemState>(() => loadSystemState());
  const [viewMode, setViewMode] = useState<"customer" | "staff" | "underwriting">("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("CUST001");
  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "error" | "syncing">("connecting");
  const hasLoadedFromBackend = useRef(false);

  // 1. Initial State Fetch on Mount
  useEffect(() => {
    setDbStatus("connecting");
    fetch("/api/state")
      .then((res) => {
        if (!res.ok) throw new Error("Server error loading database state");
        return res.json();
      })
      .then((data) => {
        setState(data);
        hasLoadedFromBackend.current = true;
        setDbStatus("connected");
      })
      .catch((err) => {
        console.error("Failed to fetch state from backend:", err);
        setDbStatus("error");
        // fallback to localStorage
        hasLoadedFromBackend.current = true;
      });
  }, []);

  // 2. Keep state synchronized with LocalStorage & Core Backend Server
  useEffect(() => {
    // Save to LocalStorage as a standard client-side backup
    saveSystemState(state);

    // Only save to the backend if the initial load from the backend completed
    if (hasLoadedFromBackend.current) {
      setDbStatus("syncing");
      fetch("/api/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(state)
      })
        .then((res) => {
          if (!res.ok) throw new Error("Sync failed");
          setDbStatus("connected");
        })
        .catch((err) => {
          console.error("Failed to sync state with backend:", err);
          setDbStatus("error");
        });
    }
  }, [state]);

  const handleStateChange = (newState: SystemState) => {
    setState(newState);
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to reset the core database to its original mock seed? All custom transactions, customer additions, and loan origins will be cleared.")) {
      return;
    }
    setDbStatus("connecting");
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset request failed");
      const data = await res.json();
      setState(data.state);
      setDbStatus("connected");
    } catch (err) {
      console.error("Failed to reset database:", err);
      setDbStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-indigo-100">
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none">
                    Osarumwense
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    dbStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    dbStatus === "syncing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                    dbStatus === "connecting" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    <Database className="w-2.5 h-2.5" />
                    <span>{dbStatus}</span>
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mt-0.5">
                  Microfinance Bank Limited
                </span>
              </div>
            </div>

            {/* Portal Toggle Button Bar */}
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700/60 shadow-inner">
              <button
                id="portal-customer-toggle"
                onClick={() => setViewMode("customer")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === "customer"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Client Portal</span>
              </button>

              <button
                id="portal-loans-toggle"
                onClick={() => setViewMode("underwriting")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === "underwriting"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Loan Origination</span>
              </button>

              <button
                id="portal-staff-toggle"
                onClick={() => setViewMode("staff")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === "staff"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>CBS Staff Portal</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Customer Switcher - displayed only for customer and loan panels to simplify testing and demonstrations! */}
        {viewMode !== "staff" && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Simulator Controller</span>
              <p className="text-xs text-gray-500 font-medium">Switch user identities instantly to test distinct client profiles</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500">Active Identity:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {state.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* View Selection Container */}
        <div className="transition-all duration-300">
          {viewMode === "customer" && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Client Mobile & Web Wallet</h2>
                <p className="text-xs text-gray-500 mt-0.5">Digital account banking, cards, QR and payments engine</p>
              </div>
              <FintechSimulator
                state={state}
                onChangeState={handleStateChange}
                selectedCustomerId={selectedCustomerId}
              />
            </div>
          )}

          {viewMode === "underwriting" && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Digital Loan Origination</h2>
                <p className="text-xs text-gray-500 mt-0.5">16 parameters credit scoring engine and digital underwriting</p>
              </div>
              <LoanOrigination
                state={state}
                onChangeState={handleStateChange}
                selectedCustomerId={selectedCustomerId}
              />
            </div>
          )}

          {viewMode === "staff" && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">CBS Core Banking Operations</h2>
                <p className="text-xs text-gray-500 mt-0.5">Branch teller positions, vault cash, bulk posting, reporting, and audit trail</p>
              </div>
              <StaffConsole
                state={state}
                onChangeState={handleStateChange}
              />
            </div>
          )}
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-900 text-gray-500 py-6 text-[11px] font-semibold tracking-wider border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 OSARUMWENSE MICROFINANCE BANK LIMITED. ALL REGULATORY COMPLIANCES COMPLY WITH CBN & NDIC STANDARDS.</p>
          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition border border-slate-750 text-[10px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Core Database (db.json)</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
