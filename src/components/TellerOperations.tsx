/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Save,
  Lock,
  RefreshCw,
  PlusCircle,
  FileCheck,
  UserCheck
} from "lucide-react";
import { SystemState, createAuditLog } from "../utils/state";
import {
  SavingsAccount,
  Transaction,
  TransactionType,
  AccountStatus
} from "../types";

interface TellerOperationsProps {
  state: SystemState;
  onChangeState: (state: SystemState) => void;
  activeStaffId: string;
}

export default function TellerOperations({
  state,
  onChangeState,
  activeStaffId
}: TellerOperationsProps) {
  // Get active teller session (default to SID001 if not initialized)
  const session = state.tellerSessions[activeStaffId] || {
    staffId: activeStaffId,
    drawerBalance: 500000,
    dailyLimit: 2000000,
    vaultTransferPending: 0,
    status: "Open" as const,
    differenceReported: 0
  };

  // State Management
  const [selectedAccNum, setSelectedAccNum] = useState("");
  const [clientName, setClientName] = useState("");
  const [txnType, setTxnType] = useState<"deposit" | "withdrawal">("deposit");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnNote, setTxnNote] = useState("");

  // Vault Transfer State
  const [vaultAction, setVaultAction] = useState<"pull" | "push">("pull");
  const [vaultAmount, setVaultAmount] = useState("");

  // Cash Balancing
  const [physicalCashCount, setPhysicalCashCount] = useState("");
  const [balancingReport, setBalancingReport] = useState<string | null>(null);

  const [uiAlert, setUiAlert] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setUiAlert({ text, type });
    setTimeout(() => { setUiAlert(null); }, 4000);
  };

  // Auto look up customer account
  const handleAccountBlur = () => {
    if (selectedAccNum.length === 10) {
      const matchAcc = state.accounts.find(a => a.accountNumber === selectedAccNum);
      if (matchAcc) {
        const matchCust = state.customers.find(c => c.id === matchAcc.customerId);
        if (matchCust) {
          setClientName(`${matchCust.firstName} ${matchCust.lastName}`);
          return;
        }
      }
      setClientName("Unknown Account");
    } else {
      setClientName("");
    }
  };

  // Submit counter cash transaction (Deposit / Withdrawal)
  const handlePostCounterTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (session.status === "Closed") {
      triggerAlert("Drawer is closed. Reopen drawer first to process cash transactions.", "error");
      return;
    }

    const amount = parseFloat(txnAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerAlert("Please enter a valid amount.", "error");
      return;
    }

    // Find account
    const accIndex = state.accounts.findIndex(a => a.accountNumber === selectedAccNum);
    if (accIndex === -1) {
      triggerAlert("Invalid Account Number.", "error");
      return;
    }

    const targetAccount = state.accounts[accIndex];

    if (txnType === "withdrawal" && targetAccount.balance < amount) {
      triggerAlert("Insufficient balance in client account.", "error");
      return;
    }

    // Limits checks for teller
    if (amount > session.dailyLimit) {
      triggerAlert(`Transaction exceeds your single transaction posting limit of ₦${session.dailyLimit.toLocaleString()}`, "error");
      return;
    }

    // If withdrawal, ensure teller drawer has enough physical cash!
    if (txnType === "withdrawal" && session.drawerBalance < amount) {
      triggerAlert("Insufficient physical cash in your drawer. Please request a Vault pull.", "error");
      return;
    }

    // Execute
    const updatedAccounts = [...state.accounts];
    const newBal = txnType === "deposit" ? targetAccount.balance + amount : targetAccount.balance - amount;
    updatedAccounts[accIndex] = {
      ...targetAccount,
      balance: newBal
    };

    // Update Drawer Balance
    const newDrawerBal = txnType === "deposit" ? session.drawerBalance + amount : session.drawerBalance - amount;
    const updatedSessions = {
      ...state.tellerSessions,
      [activeStaffId]: {
        ...session,
        drawerBalance: newDrawerBal
      }
    };

    // Create Transaction Log
    const ref = `TLR/${txnType === "deposit" ? "DEP" : "WDR"}/${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn: Transaction = {
      id: `TXN-TLR-${Date.now()}`,
      accountNumber: selectedAccNum,
      type: txnType === "deposit" ? TransactionType.CASH_DEPOSIT : TransactionType.CASH_WITHDRAWAL,
      amount: amount,
      fee: 0,
      reference: ref,
      date: new Date().toISOString(),
      postedBy: activeStaffId,
      status: "Completed",
      note: txnNote || `${txnType.toUpperCase()} of ₦${amount.toLocaleString()} posted by Teller ${activeStaffId}`,
      isCash: true
    };

    // Save
    onChangeState({
      ...state,
      accounts: updatedAccounts,
      tellerSessions: updatedSessions,
      transactions: [newTxn, ...state.transactions],
      auditLogs: [
        createAuditLog(activeStaffId, "Teller", "Cash Transaction", `Posted counter ${txnType} of ₦${amount.toLocaleString()} for ${selectedAccNum}`),
        ...state.auditLogs
      ]
    });

    setSelectedAccNum("");
    setClientName("");
    setTxnAmount("");
    setTxnNote("");
    triggerAlert(`Cash ${txnType.toUpperCase()} of ₦${amount.toLocaleString()} successfully posted!`, "success");
  };

  // Initiate Vault Transfer (Pull or Push Cash to vault)
  const handleVaultTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(vaultAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerAlert("Please specify valid amount.", "error");
      return;
    }

    if (vaultAction === "push" && session.drawerBalance < amount) {
      triggerAlert("Insufficient cash in drawer to transfer to vault.", "error");
      return;
    }

    if (vaultAction === "pull" && state.ledgers.cashInVault < amount) {
      triggerAlert("Insufficient cash reserves in main vault.", "error");
      return;
    }

    // Process Ledger Impact & Drawer Impact
    const updatedLedger = { ...state.ledgers };
    let newDrawerBal = session.drawerBalance;

    if (vaultAction === "pull") {
      updatedLedger.cashInVault -= amount;
      newDrawerBal += amount;
    } else {
      updatedLedger.cashInVault += amount;
      newDrawerBal -= amount;
    }

    const updatedSessions = {
      ...state.tellerSessions,
      [activeStaffId]: {
        ...session,
        drawerBalance: newDrawerBal
      }
    };

    onChangeState({
      ...state,
      ledgers: updatedLedger,
      tellerSessions: updatedSessions,
      auditLogs: [
        createAuditLog(activeStaffId, "Teller", "Vault Transfer", `Completed vault ${vaultAction} of ₦${amount.toLocaleString()}`),
        ...state.auditLogs
      ]
    });

    setVaultAmount("");
    triggerAlert(`Vault ${vaultAction === "pull" ? "withdrawal" : "deposit"} of ₦${amount.toLocaleString()} completed successfully.`, "success");
  };

  // Cash Balancing & Closing drawer
  const handleRunCashBalancing = (e: React.FormEvent) => {
    e.preventDefault();
    const physical = parseFloat(physicalCashCount);
    if (isNaN(physical)) {
      triggerAlert("Please enter a valid physical cash count.", "error");
      return;
    }

    const systemBal = session.drawerBalance;
    const diff = physical - systemBal;

    let balanceReportText = "";
    if (diff === 0) {
      balanceReportText = "PERFECT HARMONY: Physical cash matches system records exactly!";
    } else if (diff > 0) {
      balanceReportText = `CASH Overage: Extra physical cash of ₦${diff.toLocaleString()} detected. Logging difference.`;
    } else {
      balanceReportText = `CASH Shortage: Deficit of ₦${Math.abs(diff).toLocaleString()} detected. Logging difference.`;
    }

    setBalancingReport(balanceReportText);

    // Save Balancing & Change session status
    const updatedSessions = {
      ...state.tellerSessions,
      [activeStaffId]: {
        ...session,
        differenceReported: diff,
        status: "Closed" as const
      }
    };

    onChangeState({
      ...state,
      tellerSessions: updatedSessions,
      auditLogs: [
        createAuditLog(activeStaffId, "Teller", "End-Of-Day Closing", `Drawer closed. Physical: ₦${physical.toLocaleString()}, System: ₦${systemBal.toLocaleString()}. Status: ${diff === 0 ? "Balanced" : "Unbalanced"}`),
        ...state.auditLogs
      ]
    });
  };

  const handleReopenDrawer = () => {
    const updatedSessions = {
      ...state.tellerSessions,
      [activeStaffId]: {
        ...session,
        status: "Open" as const,
        differenceReported: 0
      }
    };
    onChangeState({
      ...state,
      tellerSessions: updatedSessions,
      auditLogs: [
        createAuditLog(activeStaffId, "Teller", "Drawer Opened", `Reopened cash drawer`),
        ...state.auditLogs
      ]
    });
    setBalancingReport(null);
    setPhysicalCashCount("");
    triggerAlert("Drawer successfully opened.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Drawer stats banner */}
      <div className="lg:col-span-4 space-y-4">
        {/* Status indicator */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">My Cash Drawer Position</span>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-gray-900">₦{session.drawerBalance.toLocaleString()}</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              session.status === "Open"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}>
              {session.status === "Open" ? "● OPEN" : "■ CLOSED"}
            </span>
          </div>
          <div className="space-y-2 text-xs text-gray-500 pt-3 border-t border-gray-100/60">
            <div className="flex justify-between">
              <span>Posting limit:</span>
              <span className="font-semibold text-gray-800">₦{session.dailyLimit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Branch Vault cash:</span>
              <span className="font-semibold text-gray-800">₦{state.ledgers.cashInVault.toLocaleString()}</span>
            </div>
          </div>
          {session.status === "Closed" && (
            <button
              onClick={handleReopenDrawer}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
            >
              Open Drawer for Postings
            </button>
          )}
        </div>

        {/* Vault Transfer Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center">
            <Coins className="w-4 h-4 mr-1.5 text-amber-500" /> Vault Cash Transfer
          </h4>
          <form onSubmit={handleVaultTransfer} className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Transfer Action</label>
              <div className="flex rounded-md bg-gray-50 p-0.5 border border-gray-100">
                <button
                  type="button"
                  onClick={() => setVaultAction("pull")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition ${
                    vaultAction === "pull" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                  }`}
                >
                  Withdraw from Vault
                </button>
                <button
                  type="button"
                  onClick={() => setVaultAction("push")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition ${
                    vaultAction === "push" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                  }`}
                >
                  Deposit to Vault
                </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Cash Amount (₦)</label>
              <input
                type="number"
                placeholder="₦0"
                value={vaultAmount}
                onChange={(e) => setVaultAmount(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded transition"
            >
              Confirm Vault Action
            </button>
          </form>
        </div>
      </div>

      {/* Main Counter Form and EOD balancing */}
      <div className="lg:col-span-8 space-y-6">
        {uiAlert && (
          <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 border ${
            uiAlert.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <span className="font-bold">{uiAlert.type === "success" ? "Success:" : "Error:"}</span>
            <span>{uiAlert.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Posting Panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Counter Cash Posting</h3>
              <p className="text-xs text-gray-500">Post deposit/withdrawal directly to client ledger</p>
            </div>

            <form onSubmit={handlePostCounterTxn} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Transaction Type</label>
                <div className="flex rounded-md bg-gray-50 p-0.5 border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setTxnType("deposit")}
                    className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center space-x-1 transition ${
                      txnType === "deposit" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Cash Deposit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType("withdrawal")}
                    className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center space-x-1 transition ${
                      txnType === "withdrawal" ? "bg-white text-rose-700 shadow-sm" : "text-gray-400"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Cash Withdrawal</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Account Number</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Enter 10 Digits"
                  value={selectedAccNum}
                  onBlur={handleAccountBlur}
                  onChange={(e) => setSelectedAccNum(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
                {clientName && (
                  <div className="mt-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-semibold rounded flex items-center space-x-1 border border-gray-100">
                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    <span>{clientName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Transaction Amount (₦)</label>
                <input
                  type="number"
                  placeholder="₦0"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Narration / Details</label>
                <input
                  type="text"
                  placeholder="Counter cash entry details"
                  value={txnNote}
                  onChange={(e) => setTxnNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={session.status === "Closed"}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
              >
                Post Transaction Ledger
              </button>
            </form>
          </div>

          {/* End of Day Balancing and drawer closure */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                <Lock className="w-4 h-4 mr-1 text-rose-500" /> End-of-Day Balancing
              </h3>
              <p className="text-xs text-gray-500">Run actual drawer closing validation checks</p>
            </div>

            {session.status === "Open" ? (
              <form onSubmit={handleRunCashBalancing} className="space-y-4">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  To close your drawer session, physically count the cash and input the absolute total below. The system will audit and register any surplus or deficit variance.
                </p>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Physical Cash Counted (₦)</label>
                  <input
                    type="number"
                    placeholder="Enter physical total"
                    value={physicalCashCount}
                    onChange={(e) => setPhysicalCashCount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Verify Cash & Close Drawer
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-4 bg-slate-50 rounded-xl border border-slate-200/40 p-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Drawer is Closed & Balanced</h4>
                  {balancingReport && (
                    <p className="text-[10px] text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed whitespace-pre-line font-medium">
                      {balancingReport}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
