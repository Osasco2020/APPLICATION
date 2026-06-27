/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  LogOut,
  User,
  ShieldCheck,
  TrendingUp,
  Coins,
  FileText,
  Sliders,
  Briefcase,
  Layers,
  Check,
  X,
  CreditCard,
  Building
} from "lucide-react";
import { SystemState, createAuditLog } from "../utils/state";
import {
  StaffRole,
  LoanStatus,
  Transaction,
  TransactionType,
  SavingsAccount
} from "../types";
import ExecutiveDashboard from "./ExecutiveDashboard";
import TellerOperations from "./TellerOperations";
import BulkPoster from "./BulkPoster";
import ReportsCenter from "./ReportsCenter";

interface StaffConsoleProps {
  state: SystemState;
  onChangeState: (state: SystemState) => void;
}

interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
}

const MOCK_STAFF_MEMBERS: StaffUser[] = [
  { id: "SID001", name: "Gabriel Alao", role: StaffRole.TELLER },
  { id: "SID002", name: "Agnes Ebhodaghe", role: StaffRole.LOAN_OFFICER },
  { id: "SID003", name: "Osas Evbuomwan", role: StaffRole.BRANCH_MANAGER },
  { id: "SID004", name: "Mustapha Musa", role: StaffRole.INTERNAL_AUDITOR },
  { id: "SID999", name: "System Admin", role: StaffRole.SYSTEM_ADMINISTRATOR }
];

export default function StaffConsole({ state, onChangeState }: StaffConsoleProps) {
  // Authentication states
  const [activeStaff, setActiveStaff] = useState<StaffUser | null>(null);
  const [staffIdInput, setStaffIdInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Sub tab selection inside CBS console
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Handle Login
  const handleStaffLogin = (idToAuth: string) => {
    const id = idToAuth.trim().toUpperCase();
    const match = MOCK_STAFF_MEMBERS.find((s) => s.id === id);

    if (match) {
      setActiveStaff(match);
      setAuthError("");
      setStaffIdInput("");

      // Default active tab based on role
      if (match.role === StaffRole.TELLER) setActiveTab("teller");
      else if (match.role === StaffRole.LOAN_OFFICER) setActiveTab("loans");
      else if (match.role === StaffRole.OPERATIONS_OFFICER) setActiveTab("bulk_posting");
      else if (match.role === StaffRole.INTERNAL_AUDITOR) setActiveTab("reports");
      else setActiveTab("dashboard");

      // Save audit log
      onChangeState({
        ...state,
        auditLogs: [
          createAuditLog(match.id, match.role, "Staff Login", `Staff logged in via core portal`),
          ...state.auditLogs
        ]
      });
    } else {
      setAuthError("Invalid Staff ID. Use SID001, SID002, SID003 or SID999 for testing.");
    }
  };

  // Handle Log out
  const handleLogout = () => {
    if (activeStaff) {
      const staffCopy = { ...activeStaff };
      setActiveStaff(null);
      onChangeState({
        ...state,
        auditLogs: [
          createAuditLog(staffCopy.id, staffCopy.role, "Staff Logout", `Staff logged out`),
          ...state.auditLogs
        ]
      });
    }
  };

  // Loan Officer Disbursal process
  const handleLoanApproval = (loanId: string, action: "approve" | "reject") => {
    if (!activeStaff) return;

    const updatedLoans = state.loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          status: action === "approve" ? LoanStatus.APPROVED : LoanStatus.REJECTED
        };
      }
      return l;
    });

    const loanDetails = state.loans.find(l => l.id === loanId);
    const applicant = loanDetails ? state.customers.find(c => c.id === loanDetails.customerId) : null;
    const applicantName = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Client";

    onChangeState({
      ...state,
      loans: updatedLoans,
      auditLogs: [
        createAuditLog(
          activeStaff.id,
          activeStaff.role,
          action === "approve" ? "Loan Approved" : "Loan Rejected",
          `${action === "approve" ? "Approved" : "Rejected"} loan ${loanId} for ${applicantName} in amount of ₦${loanDetails?.principal.toLocaleString()}`
        ),
        ...state.auditLogs
      ]
    });
  };

  // Loan Disbursal (Maker Checker execution) - Adds funds directly into the client's savings wallet!
  const handleDisburseLoan = (loanId: string) => {
    if (!activeStaff) return;

    const loanIdx = state.loans.findIndex((l) => l.id === loanId);
    if (loanIdx === -1) return;

    const loan = state.loans[loanIdx];

    // Find applicant primary savings account to credit
    const clientAccIdx = state.accounts.findIndex((a) => a.customerId === loan.customerId);
    if (clientAccIdx === -1) {
      alert("Error: Applicant has no savings account to credit loan principal. Please open an account for them first.");
      return;
    }

    const clientAccount = state.accounts[clientAccIdx];

    // Execution
    const updatedLoans = [...state.loans];
    updatedLoans[loanIdx] = {
      ...loan,
      status: LoanStatus.DISBURSED,
      disbursedAt: new Date().toISOString()
    };

    const updatedAccounts = [...state.accounts];
    updatedAccounts[clientAccIdx] = {
      ...clientAccount,
      balance: clientAccount.balance + loan.principal
    };

    // Credit Ledger (Reduce Vault Cash, increase customer deposits liability)
    const updatedLedgers = {
      ...state.ledgers,
      cashInVault: state.ledgers.cashInVault - loan.principal
    };

    // Record Transaction
    const ref = `DISB/LND/${Math.floor(100000 + Math.random() * 900000)}`;
    const disTxn: Transaction = {
      id: `TXN-DISB-${Date.now()}`,
      accountNumber: clientAccount.accountNumber,
      loanId: loan.id,
      type: TransactionType.LOAN_DISBURSEMENT,
      amount: loan.principal,
      fee: 0,
      reference: ref,
      date: new Date().toISOString(),
      postedBy: activeStaff.id,
      status: "Completed",
      note: `Digital Disbursal credit for ${loan.productType} (${loan.id})`,
      isCash: false
    };

    onChangeState({
      ...state,
      loans: updatedLoans,
      accounts: updatedAccounts,
      ledgers: updatedLedgers,
      transactions: [disTxn, ...state.transactions],
      auditLogs: [
        createAuditLog(activeStaff.id, activeStaff.role, "Loan Disbursed", `Disbursed ₦${loan.principal.toLocaleString()} onto client savings wallet ${clientAccount.accountNumber}`),
        ...state.auditLogs
      ]
    });
  };

  // Tabs list matching RBAC rules
  const getTabsForRole = (role: StaffRole) => {
    const list = [];
    if ([StaffRole.BRANCH_MANAGER, StaffRole.CREDIT_OFFICER, StaffRole.SYSTEM_ADMINISTRATOR].includes(role)) {
      list.push({ id: "dashboard", label: "Executive Dashboard", icon: TrendingUp });
    }
    if ([StaffRole.TELLER, StaffRole.OPERATIONS_OFFICER, StaffRole.SYSTEM_ADMINISTRATOR].includes(role)) {
      list.push({ id: "teller", label: "Teller Cash Desk", icon: Coins });
    }
    if ([StaffRole.LOAN_OFFICER, StaffRole.CREDIT_OFFICER, StaffRole.BRANCH_MANAGER, StaffRole.SYSTEM_ADMINISTRATOR].includes(role)) {
      list.push({ id: "loans", label: "Loan Underwriting Desk", icon: Briefcase });
    }
    if ([StaffRole.OPERATIONS_OFFICER, StaffRole.SYSTEM_ADMINISTRATOR, StaffRole.BRANCH_MANAGER].includes(role)) {
      list.push({ id: "bulk_posting", label: "Bulk Posting Hub", icon: Sliders });
    }
    if ([StaffRole.BRANCH_MANAGER, StaffRole.INTERNAL_AUDITOR, StaffRole.SYSTEM_ADMINISTRATOR].includes(role)) {
      list.push({ id: "reports", label: "Financial Reports", icon: FileText });
    }
    if ([StaffRole.INTERNAL_AUDITOR, StaffRole.SYSTEM_ADMINISTRATOR].includes(role)) {
      list.push({ id: "auditing", label: "Compliance Audits", icon: ShieldCheck });
    }
    return list;
  };

  return (
    <div className="min-h-[500px] bg-slate-50/50 rounded-xl border border-slate-100/80 overflow-hidden">
      {!activeStaff ? (
        /* Login Screen with Quick Access Cards */
        <div className="max-w-md mx-auto py-12 px-6">
          <div className="text-center space-y-2 mb-8">
            <Building className="w-10 h-10 mx-auto text-indigo-600 animate-bounce" />
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Osarumwense CBS Portal</h3>
            <p className="text-xs text-gray-500">Core Banking System (CBS) Admin Console login</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Secure Staff ID Credentials</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. SID001"
                  value={staffIdInput}
                  onChange={(e) => setStaffIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono font-bold uppercase tracking-wider"
                />
                <button
                  onClick={() => handleStaffLogin(staffIdInput)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Authorize Login
                </button>
              </div>
              {authError && <p className="text-[10px] text-rose-500 font-medium mt-1.5">{authError}</p>}
            </div>

            {/* Quick credentials shortcut panel */}
            <div className="pt-3 border-t border-slate-100/60">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Quick-Access Demo ID Badges</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOCK_STAFF_MEMBERS.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStaffLogin(s.id)}
                    className="flex items-center space-x-2.5 p-2 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/25 text-left transition"
                  >
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-800 block leading-tight">{s.name}</span>
                      <span className="text-[9px] text-gray-400 block font-mono leading-none">{s.id} · {s.role.split(" ")[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Logged In CBS Dashboard Console */
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Side menu for permissions */}
          <div className="lg:col-span-3 bg-white border-r border-slate-100 p-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Badge */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-800 block truncate">{activeStaff.name}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/50 border border-indigo-100/30 rounded px-1.5 py-0.5 mt-0.5 inline-block font-mono leading-none">{activeStaff.role}</span>
                  <span className="text-[9px] text-gray-400 block font-mono mt-1 leading-none">ID: {activeStaff.id}</span>
                </div>
              </div>

              {/* Navigation Tabs based on role RBAC permissions */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-1">CBS Admin Menu</span>
                {getTabsForRole(activeStaff.role).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/50 text-rose-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out CBS Console</span>
            </button>
          </div>

          {/* Right workspace panels */}
          <div className="lg:col-span-9 p-6">
            {activeTab === "dashboard" && <ExecutiveDashboard state={state} />}

            {activeTab === "teller" && (
              <TellerOperations
                state={state}
                onChangeState={onChangeState}
                activeStaffId={activeStaff.id}
              />
            )}

            {activeTab === "bulk_posting" && (
              <BulkPoster
                state={state}
                onChangeState={onChangeState}
                activeStaffId={activeStaff.id}
              />
            )}

            {activeTab === "reports" && <ReportsCenter state={state} />}

            {activeTab === "loans" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Loan Underwriting & Verification Desk</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage client loan queues, review automated scoring metrics, and process credits maker-checker disbursals.
                  </p>
                </div>

                {/* Queue lists */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {state.loans
                    .filter(l => l.status === LoanStatus.APPLIED || l.status === LoanStatus.APPROVED)
                    .map((loan) => {
                      const client = state.customers.find(c => c.id === loan.customerId);
                      return (
                        <div key={loan.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-gray-800">
                                {client ? `${client.firstName} ${client.lastName}` : "Unknown Applicant"}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">({loan.customerId})</span>
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                {loan.productType}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 font-medium">
                              <span>Amount: <b className="text-gray-800">₦{loan.principal.toLocaleString()}</b></span>
                              <span>Tenor: <b className="text-gray-800">{loan.tenor} Mo</b></span>
                              <span>Credit Score: <b className="text-indigo-600">{loan.creditScore} ({loan.riskRating})</b></span>
                            </div>
                            {loan.cacNumber && (
                              <div className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-1 rounded inline-block">
                                SME CAC Verfied: #{loan.cacNumber} / Entity: {loan.businessName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 self-end md:self-auto">
                            {loan.status === "Applied" ? (
                              <>
                                <button
                                  onClick={() => handleLoanApproval(loan.id, "reject")}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                                <button
                                  onClick={() => handleLoanApproval(loan.id, "approve")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Portfolio</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDisburseLoan(loan.id)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm transition"
                              >
                                <Coins className="w-4 h-4" />
                                <span>Disburse Principal Ledger Credit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {state.loans.filter(l => l.status === LoanStatus.APPLIED || l.status === LoanStatus.APPROVED).length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400 font-medium">No pending underwriting queues or disbursal queues active.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "auditing" && (
              <div className="space-y-4 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Regulatory Security Audit & Compliance Center</h3>
                  <p className="text-xs text-gray-500 mt-1">Audit logs for banking operations regulatory reporting</p>
                </div>

                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {state.auditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex justify-between items-start text-xs font-medium text-gray-700">
                      <div>
                        <span className="font-bold text-gray-800 block">{log.action}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{log.timestamp} · User: {log.userId} · Role: {log.role}</span>
                        <p className="text-[11px] text-gray-500 leading-normal mt-0.5">{log.details}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === "Success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
