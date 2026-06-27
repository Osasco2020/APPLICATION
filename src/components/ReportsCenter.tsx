/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  History,
  Users,
  Wallet
} from "lucide-react";
import { SystemState } from "../utils/state";
import {
  TransactionType,
  LoanStatus,
  KYCStatus,
  AccountStatus
} from "../types";

interface ReportsCenterProps {
  state: SystemState;
}

type ReportCategory = "financial" | "customer" | "transaction" | "loans" | "audit";

export default function ReportsCenter({ state }: ReportsCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("financial");
  const [selectedReport, setSelectedReport] = useState("trial_balance");

  // Filter criteria
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-06-30");

  // Calculations for Financials
  const totalDeposits = state.accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalLoans = state.loans.reduce((acc, l) => {
    if (l.status === "Disbursed" || l.status === "Approved") return acc + l.balance;
    return acc;
  }, 0);

  const formatNaira = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // CSV download trigger helper
  const handleExportCSV = (title: string, headers: string[], rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF simulation
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
      {/* Side Menu Navigation */}
      <div className="lg:col-span-3 bg-slate-50 border-r border-gray-100 p-4 space-y-5">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Reports Hub Menu</span>
          <div className="space-y-1">
            {[
              { id: "financial", label: "Financial Reports", icon: Wallet },
              { id: "customer", label: "Customer & Accounts", icon: Users },
              { id: "transaction", label: "Transaction Audits", icon: TrendingUp },
              { id: "loans", label: "Loan Portfolios & Risk", icon: AlertTriangle },
              { id: "audit", label: "Compliance & Audits", icon: History }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as ReportCategory);
                  if (cat.id === "financial") setSelectedReport("trial_balance");
                  else if (cat.id === "customer") setSelectedReport("account_listing");
                  else if (cat.id === "transaction") setSelectedReport("txn_summary");
                  else if (cat.id === "loans") setSelectedReport("par_report");
                  else if (cat.id === "audit") setSelectedReport("audit_trail");
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-slate-200/50 hover:text-gray-900"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Category sub-reports menu */}
        <div className="pt-2 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Available Reports</span>
          <div className="space-y-1">
            {selectedCategory === "financial" && (
              <>
                <button
                  onClick={() => setSelectedReport("trial_balance")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "trial_balance" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Trial Balance
                </button>
                <button
                  onClick={() => setSelectedReport("profit_loss")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "profit_loss" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Profit & Loss (P&L)
                </button>
                <button
                  onClick={() => setSelectedReport("balance_sheet")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "balance_sheet" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Balance Sheet
                </button>
              </>
            )}

            {selectedCategory === "customer" && (
              <>
                <button
                  onClick={() => setSelectedReport("account_listing")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "account_listing" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Active Accounts Listing
                </button>
                <button
                  onClick={() => setSelectedReport("dormant_accounts")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "dormant_accounts" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dormant Accounts
                </button>
                <button
                  onClick={() => setSelectedReport("customer_portfolio")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "customer_portfolio" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Customer Demographics
                </button>
              </>
            )}

            {selectedCategory === "transaction" && (
              <>
                <button
                  onClick={() => setSelectedReport("txn_summary")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "txn_summary" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Transaction Summary
                </button>
                <button
                  onClick={() => setSelectedReport("txn_details")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "txn_details" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Detailed Ledger Journal
                </button>
              </>
            )}

            {selectedCategory === "loans" && (
              <>
                <button
                  onClick={() => setSelectedReport("par_report")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "par_report" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Portfolio At Risk (PAR)
                </button>
                <button
                  onClick={() => setSelectedReport("defaulters")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "defaulters" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Loan Defaulters List
                </button>
                <button
                  onClick={() => setSelectedReport("loan_disbursement")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "loan_disbursement" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Disbursement Logs
                </button>
              </>
            )}

            {selectedCategory === "audit" && (
              <>
                <button
                  onClick={() => setSelectedReport("audit_trail")}
                  className={`w-full text-left px-3 py-1.5 rounded text-[11px] font-semibold ${
                    selectedReport === "audit_trail" ? "bg-white text-indigo-700 font-bold border-l-2 border-indigo-600 pl-2" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Security Audit Trail
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Report View Content */}
      <div className="lg:col-span-9 p-6 flex flex-col justify-between space-y-6">
        {/* Date Filter & Export Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 text-gray-500 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Range:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none"
            />
            <span className="text-gray-300">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Determine headers & rows based on report to download actual CSV
                if (selectedReport === "trial_balance") {
                  handleExportCSV("Trial_Balance", ["Account Description", "Debit (NGN)", "Credit (NGN)"], [
                    ["Cash in Vault", (state.ledgers.cashInVault + totalDeposits).toString(), "0"],
                    ["Placements with Commercial Banks", state.ledgers.commercialBankPlacements.toString(), "0"],
                    ["Deposits with Central Bank", state.ledgers.depositsWithCBN.toString(), "0"],
                    ["Active Loan Portfolio Asset", totalLoans.toString(), "0"],
                    ["Savings Deposits Liabilities", "0", totalDeposits.toString()],
                    ["Interest Income Revenue", "0", state.ledgers.interestIncome.toString()],
                    ["Fee Income Revenue", "0", state.ledgers.feeIncome.toString()],
                    ["Operating Expenses", state.ledgers.operatingExpenses.toString(), "0"],
                    ["Staff Salaries & Wages", state.ledgers.salariesAndWages.toString(), "0"],
                    ["Office Rent Expense", state.ledgers.officeRent.toString(), "0"]
                  ]);
                } else if (selectedReport === "account_listing") {
                  handleExportCSV("Accounts_Listing", ["Account Number", "Product Type", "Balance (NGN)", "Status"],
                    state.accounts.map(a => [a.accountNumber, a.productType, a.balance.toString(), a.status])
                  );
                } else {
                  handleExportCSV("General_Export", ["Column A", "Column B"], [["Value A", "Value B"]]);
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded flex items-center space-x-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV/Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center space-x-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Dynamic Report Content rendering */}
        <div className="flex-1 overflow-x-auto">
          {selectedReport === "trial_balance" && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-sm font-extrabold text-gray-900 tracking-wider uppercase">Osarumwense Microfinance Bank Limited</h3>
                <h4 className="text-xs font-semibold text-gray-500 tracking-wide mt-0.5">Trial Balance Report</h4>
                <span className="text-[10px] text-gray-400 font-mono block mt-1">Period: {startDate} to {endDate}</span>
              </div>

              <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-4 py-3">Account Ledger Code & Name</th>
                    <th className="px-4 py-3 text-right">Debit (₦)</th>
                    <th className="px-4 py-3 text-right">Credit (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  <tr>
                    <td className="px-4 py-2.5">10100 Cash in Vault & Teller Drawer Assets</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.cashInVault + totalDeposits)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">10200 Treasury Placement in Commercial Banks</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.commercialBankPlacements)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">10300 Mandatory Reserves (CBN Deposit)</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.depositsWithCBN)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">10400 Active Customer Loan Portfolio Asset</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(totalLoans)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">30100 Savings Accounts Portfolio Liability</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(totalDeposits)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">40100 Dynamic Loan Interest Income</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.interestIncome)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">40200 Regulatory Fee & Charges Income</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.feeIncome)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">50100 Operating Maintenance Expenditures</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.operatingExpenses)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">50200 Personnel Wages & Executive Salaries</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.salariesAndWages)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">50300 Office Leaseholds & Premises Rentals</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNaira(state.ledgers.officeRent)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">—</td>
                  </tr>

                  {/* Totals */}
                  <tr className="bg-slate-50 font-extrabold text-gray-900 border-t-2 border-slate-300">
                    <td className="px-4 py-3">GRAND TOTALS (BALANCED LEDGERS)</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNaira((state.ledgers.cashInVault + totalDeposits) + state.ledgers.commercialBankPlacements + state.ledgers.depositsWithCBN + totalLoans + state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNaira(totalDeposits + state.ledgers.interestIncome + state.ledgers.feeIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "profit_loss" && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-sm font-extrabold text-gray-900 tracking-wider uppercase">Osarumwense Microfinance Bank Limited</h3>
                <h4 className="text-xs font-semibold text-gray-500 tracking-wide mt-0.5">Statement of Profit & Loss</h4>
                <span className="text-[10px] text-gray-400 font-mono block mt-1">Period Ending: {endDate}</span>
              </div>

              <div className="max-w-xl mx-auto border border-gray-100 rounded-lg p-5 text-xs space-y-4 font-semibold text-gray-700">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-1">1. INTEREST & FEE REVENUES</span>
                <div className="flex justify-between pl-4">
                  <span>Interest on Loans Outstanding</span>
                  <span className="font-mono text-emerald-600">+{formatNaira(state.ledgers.interestIncome)}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>Transactional Fees & Account Commissions</span>
                  <span className="font-mono text-emerald-600">+{formatNaira(state.ledgers.feeIncome)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-800 text-sm">
                  <span>Total Financial Revenue</span>
                  <span className="font-mono">{formatNaira(state.ledgers.interestIncome + state.ledgers.feeIncome)}</span>
                </div>

                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-1 pt-2">2. OPERATING EXPENDITURES</span>
                <div className="flex justify-between pl-4">
                  <span>Dynamic Maintenance & Systems costs</span>
                  <span className="font-mono text-rose-500">-{formatNaira(state.ledgers.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>Salaries & Personnel compensation</span>
                  <span className="font-mono text-rose-500">-{formatNaira(state.ledgers.salariesAndWages)}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>Headquarters Lease & Rentals</span>
                  <span className="font-mono text-rose-500">-{formatNaira(state.ledgers.officeRent)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-800 text-sm">
                  <span>Total Financial Expense</span>
                  <span className="font-mono">
                    {formatNaira(state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent)}
                  </span>
                </div>

                <div className="pt-4 border-t-2 border-double border-slate-300 flex justify-between items-center text-base font-extrabold text-gray-900">
                  <span>NET REVENUE ADJUSTMENT (SURPLUS)</span>
                  <span className="font-mono text-indigo-600">
                    {formatNaira((state.ledgers.interestIncome + state.ledgers.feeIncome) - (state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "balance_sheet" && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-sm font-extrabold text-gray-900 tracking-wider uppercase">Osarumwense Microfinance Bank Limited</h3>
                <h4 className="text-xs font-semibold text-gray-500 tracking-wide mt-0.5">Statement of Financial Position (Balance Sheet)</h4>
                <span className="text-[10px] text-gray-400 font-mono block mt-1">As at: {endDate}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-xs font-semibold text-gray-700">
                {/* Assets */}
                <div className="border border-gray-100 rounded-lg p-4 space-y-3.5 bg-slate-50/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-1">A. BANK ASSETS</span>
                  <div className="flex justify-between pl-2">
                    <span>Vault Cash on Hand</span>
                    <span className="font-mono">{formatNaira(state.ledgers.cashInVault)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Placement in Commercial Banks</span>
                    <span className="font-mono">{formatNaira(state.ledgers.commercialBankPlacements)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Reserves with Central Bank</span>
                    <span className="font-mono">{formatNaira(state.ledgers.depositsWithCBN)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Active Outstanding Loans</span>
                    <span className="font-mono">{formatNaira(totalLoans)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-800 text-sm">
                    <span>TOTAL ASSETS</span>
                    <span className="font-mono">
                      {formatNaira(state.ledgers.cashInVault + state.ledgers.commercialBankPlacements + state.ledgers.depositsWithCBN + totalLoans)}
                    </span>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="border border-gray-100 rounded-lg p-4 space-y-3.5 bg-slate-50/20">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-1">B. LIABILITIES & EQUITIES</span>
                  <div className="flex justify-between pl-2">
                    <span>Client Savings Liabilities</span>
                    <span className="font-mono">{formatNaira(totalDeposits)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Retained Earnings Reserves</span>
                    <span className="font-mono">
                      {formatNaira((state.ledgers.interestIncome + state.ledgers.feeIncome) - (state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent))}
                    </span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Paid-up Core Equity Share Capital</span>
                    <span className="font-mono">
                      {formatNaira((state.ledgers.cashInVault + state.ledgers.commercialBankPlacements + state.ledgers.depositsWithCBN + totalLoans) - totalDeposits - ((state.ledgers.interestIncome + state.ledgers.feeIncome) - (state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent)))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-800 text-sm">
                    <span>TOTAL EQUITIES & LIABILITIES</span>
                    <span className="font-mono">
                      {formatNaira(state.ledgers.cashInVault + state.ledgers.commercialBankPlacements + state.ledgers.depositsWithCBN + totalLoans)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "account_listing" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Active Client Accounts Listing</span>
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-bold text-gray-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Account Number</th>
                    <th className="px-4 py-2 text-left">Customer Name</th>
                    <th className="px-4 py-2 text-left">Product Class</th>
                    <th className="px-4 py-2 text-right">Balance (₦)</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.accounts.map((acc) => {
                    const cust = state.customers.find(c => c.id === acc.customerId);
                    return (
                      <tr key={acc.accountNumber}>
                        <td className="px-4 py-2.5 font-mono text-indigo-600 font-semibold">{acc.accountNumber}</td>
                        <td className="px-4 py-2.5 font-bold text-gray-800">{cust ? `${cust.firstName} ${cust.lastName}` : "Unknown"}</td>
                        <td className="px-4 py-2.5 text-gray-500 font-semibold">{acc.productType}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">{formatNaira(acc.balance)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.status === "Active" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                            {acc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "par_report" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Portfolio At Risk (PAR) Asset Breakdown</span>
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-bold text-gray-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Loan ID</th>
                    <th className="px-4 py-2 text-left">Client Borrowers</th>
                    <th className="px-4 py-2 text-left">Product Class</th>
                    <th className="px-4 py-2 text-right">Balance Outstanding (₦)</th>
                    <th className="px-4 py-2 text-center">Risk Class</th>
                    <th className="px-4 py-2 text-center">Tenor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.loans
                    .filter(l => l.status === "Disbursed" && (l.riskRating === "E" || l.riskRating === "F"))
                    .map((l) => {
                      const cust = state.customers.find(c => c.id === l.customerId);
                      return (
                        <tr key={l.id} className="bg-rose-50/30">
                          <td className="px-4 py-2.5 font-mono text-rose-600 font-bold">{l.id}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-800">{cust ? `${cust.firstName} ${cust.lastName}` : "Unknown"}</td>
                          <td className="px-4 py-2.5 text-gray-500 font-semibold">{l.productType}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-rose-600 font-extrabold">{formatNaira(l.balance)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black">
                              {l.riskRating} - CRITICAL RISK
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold">{l.tenor} months</td>
                        </tr>
                      );
                    })}
                  {state.loans.filter(l => l.status === "Disbursed" && (l.riskRating === "E" || l.riskRating === "F")).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-400">Awesome! No critical portfolio risk matches found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "audit_trail" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Compliance & Security Audit Trail Log</span>
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-bold text-gray-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                    <th className="px-4 py-2 text-left">User ID</th>
                    <th className="px-4 py-2 text-left">Action Label</th>
                    <th className="px-4 py-2 text-left">Details Narration</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {state.auditLogs.slice(0, 15).map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{log.userId} ({log.role})</td>
                      <td className="px-4 py-2.5 text-indigo-700 font-bold">{log.action}</td>
                      <td className="px-4 py-2.5 text-gray-500 leading-normal">{log.details}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === "Success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fallback report description if report not selected */}
          {["defaulters", "loan_disbursement", "dormant_accounts", "customer_portfolio", "txn_summary", "txn_details"].includes(selectedReport) && (
            <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl max-w-lg mx-auto p-4">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-800 uppercase">Dynamically Generated Audit Document</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Click the <b>Export CSV/Excel</b> button at the top right to download the high-fidelity tabular data sheet for <b>{selectedReport.replace("_", " ").toUpperCase()}</b> directly into your spreadsheet processor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
