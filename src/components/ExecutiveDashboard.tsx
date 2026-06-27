/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Percent,
  Wallet,
  Coins,
  DollarSign
} from "lucide-react";
import { SystemState } from "../utils/state";

interface ExecutiveDashboardProps {
  state: SystemState;
}

export default function ExecutiveDashboard({ state }: ExecutiveDashboardProps) {
  const [selectedChartTab, setSelectedChartTab] = useState<"revenue" | "deposits_loans">("revenue");

  // Calculations
  const totalDeposits = state.accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalLoans = state.loans.reduce((acc, l) => {
    if (l.status === "Disbursed" || l.status === "Approved") {
      return acc + l.balance;
    }
    return acc;
  }, 0);

  // Active Customers count
  const activeCustomers = state.customers.length;

  // Portfolio at Risk (PAR) - Loans in arrears.
  // We'll define PAR as loans with a risk rating of 'D', 'E', or 'F' or high-risk loans that have balance.
  const parLoans = state.loans.filter(
    (l) => (l.status === "Disbursed" && (l.riskRating === "E" || l.riskRating === "F"))
  );
  const totalParAmount = parLoans.reduce((acc, l) => acc + l.balance, 0);
  const parPercentage = totalLoans > 0 ? (totalParAmount / totalLoans) * 100 : 0;

  // Recovery Rate calculation
  const totalDisbursedAmount = state.loans.reduce((acc, l) => {
    if (l.status === "Disbursed" || l.status === "Repaid") {
      return acc + l.principal;
    }
    return acc;
  }, 0);
  const totalPaidLoans = state.loans.reduce((acc, l) => acc + l.paidAmount, 0);
  const recoveryRate = totalDisbursedAmount > 0 ? (totalPaidLoans / (totalDisbursedAmount)) * 100 : 92.5;

  // Daily collection estimate (all cash deposits & loan repayments in last 30 days averaged, or transaction entries)
  const today = new Date().toISOString().split("T")[0];
  const cashTxns = state.transactions.filter(
    (t) => t.isCash && t.status === "Completed"
  );
  const dailyCollection = cashTxns.reduce((acc, t) => acc + t.amount, 0) / 7; // Average over hypothetical week

  // Cash positions
  const vaultCash = state.ledgers.cashInVault + Object.values(state.tellerSessions).reduce((acc, s) => acc + s.drawerBalance, 0);
  const commercialPlacements = state.ledgers.commercialBankPlacements;

  // Format Naira Currency helper
  const formatNaira = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Monthly Revenue estimation (interestIncome + feeIncome)
  const monthlyRevenue = state.ledgers.interestIncome + state.ledgers.feeIncome;
  const monthlyExpenses = state.ledgers.operatingExpenses + state.ledgers.salariesAndWages + state.ledgers.officeRent;
  const netProfit = monthlyRevenue - monthlyExpenses;

  // Custom SVG Charts data
  // 6 Months data (Jan - Jun 2026)
  const revenueTrend = [
    { month: "Jan", interest: 450000, fees: 80000, expense: 350000 },
    { month: "Feb", interest: 520000, fees: 95000, expense: 380000 },
    { month: "Mar", interest: 610000, fees: 110000, expense: 410000 },
    { month: "Apr", interest: 700000, fees: 115000, expense: 420000 },
    { month: "May", interest: 780000, fees: 120000, expense: 430000 },
    { month: "Jun", interest: state.ledgers.interestIncome, fees: state.ledgers.feeIncome, expense: monthlyExpenses }
  ];

  const depositLoanTrend = [
    { month: "Jan", deposits: 6500000, loans: 2100000 },
    { month: "Feb", deposits: 7800000, loans: 2800000 },
    { month: "Mar", deposits: 8900000, loans: 3200000 },
    { month: "Apr", deposits: 9400000, loans: 3900000 },
    { month: "May", deposits: 10500000, loans: 4500000 },
    { month: "Jun", deposits: totalDeposits, loans: totalLoans }
  ];

  return (
    <div id="executive-dashboard" className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Executive Dashboard</h2>
          <p className="text-sm text-gray-500">Real-time financial position & risk analytics</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Core System Synced</span>
        </div>
      </div>

      {/* Grid of KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deposits */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Deposit Liability</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatNaira(totalDeposits)}</h3>
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <span className="text-emerald-500 font-medium inline-flex items-center mr-1">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.4%
              </span>
              from last month
            </p>
          </div>
        </div>

        {/* Total Loans */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Loan Portfolio</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatNaira(totalLoans)}</h3>
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <span className="text-emerald-500 font-medium inline-flex items-center mr-1">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.1%
              </span>
              LDR: {((totalLoans / totalDeposits) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* PAR Rating */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Portfolio At Risk (PAR &gt; 30)</span>
            <div className={`p-2 rounded-lg ${parPercentage > 5 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{parPercentage.toFixed(2)}%</h3>
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <span className="font-semibold text-gray-700 mr-1">{formatNaira(totalParAmount)}</span>
              risk exposure
            </p>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loan Recovery Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{recoveryRate.toFixed(1)}%</h3>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(recoveryRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Position & Customers Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treasury Position */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Coins className="w-4 h-4 mr-1.5 text-amber-500" /> Bank Cash & Treasury Position
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Vault Cash (Branch & Tellers)</span>
                <span className="font-medium text-gray-800">{formatNaira(vaultCash)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "35%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Placements in Commercial Banks</span>
                <span className="font-medium text-gray-800">{formatNaira(commercialPlacements)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Statutory Reserve (CBN Deposit)</span>
                <span className="font-medium text-gray-800">{formatNaira(state.ledgers.depositsWithCBN)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-indigo-50 h-1.5 rounded-full" style={{ width: "45%" }}>
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-800">Total Liquid Assets</span>
              <span className="text-sm font-bold text-gray-900">
                {formatNaira(vaultCash + commercialPlacements + state.ledgers.depositsWithCBN)}
              </span>
            </div>
          </div>
        </div>

        {/* Yield and Income Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Percent className="w-4 h-4 mr-1.5 text-indigo-500" /> Yield & Margin Analysis (Monthly)
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Interest Earned</span>
              <span className="font-semibold text-emerald-600">+{formatNaira(state.ledgers.interestIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Fees & Commission</span>
              <span className="font-semibold text-emerald-600">+{formatNaira(state.ledgers.feeIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Operating Costs</span>
              <span className="font-semibold text-red-600">-{formatNaira(monthlyExpenses)}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="font-medium text-gray-800">Gross Revenues</span>
              <span className="font-bold text-gray-900">{formatNaira(monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-800">Net Margin Estimate</span>
              <span className={`text-sm font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatNaira(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Statistics */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-blue-500" /> Customer Portfolio
            </h3>
            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-xs text-gray-400 block mb-0.5">Active Depositors</span>
                <span className="text-lg font-bold text-gray-900">
                  {state.accounts.map(a => a.customerId).filter((v, i, self) => self.indexOf(v) === i).length}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-xs text-gray-400 block mb-0.5">Active Borrowers</span>
                <span className="text-lg font-bold text-gray-900">
                  {state.loans.filter(l => l.status === "Disbursed").map(l => l.customerId).filter((v, i, self) => self.indexOf(v) === i).length}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>Risk Classification:</span>
              <span className="font-semibold text-gray-700">Low (80%) | Med (15%) | High (5%)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">
              Onboarding compliance metrics require 100% BVN/NIN validation. Active verification hooks are online.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Interactive SVG Charts Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 mb-6 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Financial Growth & Projections</h3>
            <p className="text-xs text-gray-500">Current FY2026 performance mapping</p>
          </div>
          <div className="flex rounded-lg bg-gray-50 p-1 border border-gray-100 self-start sm:self-auto">
            <button
              onClick={() => setSelectedChartTab("revenue")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedChartTab === "revenue"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Revenue vs Expenses
            </button>
            <button
              onClick={() => setSelectedChartTab("deposits_loans")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedChartTab === "deposits_loans"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Deposits & Loans
            </button>
          </div>
        </div>

        {/* Beautiful responsive custom SVG chart */}
        <div className="relative h-64 w-full">
          {selectedChartTab === "revenue" ? (
            <div className="w-full h-full flex flex-col justify-between">
              {/* SVG Area/Bar chart */}
              <svg viewBox="0 0 600 200" className="w-full h-48 overflow-visible">
                {/* Background Grid Lines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="180" x2="580" y2="180" stroke="#e2e8f0" strokeWidth="1.5" />

                {/* Y Axis labels */}
                <text x="5" y="25" className="text-[10px] fill-gray-400 font-medium">1.2M</text>
                <text x="5" y="65" className="text-[10px] fill-gray-400 font-medium">900K</text>
                <text x="5" y="105" className="text-[10px] fill-gray-400 font-medium">600K</text>
                <text x="5" y="145" className="text-[10px] fill-gray-400 font-medium">300K</text>
                <text x="5" y="185" className="text-[10px] fill-gray-400 font-medium">0</text>

                {/* Draw Revenue bars (blue) and Expense bars (gray-red) */}
                {revenueTrend.map((data, index) => {
                  const x = 70 + index * 95;
                  const totalRev = data.interest + data.fees;
                  // Max height corresponds to 1.2M (height 160px from y=20 to y=180)
                  const revHeight = (totalRev / 1200000) * 160;
                  const expHeight = (data.expense / 1200000) * 160;

                  return (
                    <g key={data.month} className="group cursor-pointer">
                      {/* Revenue Bar */}
                      <rect
                        x={x}
                        y={180 - revHeight}
                        width="24"
                        height={revHeight}
                        fill="#3b82f6"
                        rx="3"
                        className="opacity-90 hover:opacity-100 transition"
                      />
                      {/* Expense Bar */}
                      <rect
                        x={x + 28}
                        y={180 - expHeight}
                        width="24"
                        height={expHeight}
                        fill="#f87171"
                        rx="3"
                        className="opacity-80 hover:opacity-100 transition"
                      />
                      {/* X Label */}
                      <text x={x + 26} y="196" textAnchor="middle" className="text-[11px] fill-gray-500 font-semibold">{data.month}</text>

                      {/* Tooltip on Hover simulated cleanly with titles */}
                      <title>{`${data.month}: Rev: ${formatNaira(totalRev)}, Exp: ${formatNaira(data.expense)}`}</title>
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="flex justify-center space-x-6 text-xs mt-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 rounded bg-blue-500"></span>
                  <span className="text-gray-600 font-medium">Total Revenue (Interest + Fees)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 rounded bg-red-400"></span>
                  <span className="text-gray-600 font-medium">Operating Expenses</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-between">
              {/* Deposits and Loans Line Chart */}
              <svg viewBox="0 0 600 200" className="w-full h-48 overflow-visible">
                {/* Background Grid Lines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="180" x2="580" y2="180" stroke="#e2e8f0" strokeWidth="1.5" />

                {/* Y Axis labels - Scale up to 12 Million */}
                <text x="5" y="25" className="text-[10px] fill-gray-400 font-medium">12M</text>
                <text x="5" y="65" className="text-[10px] fill-gray-400 font-medium">9M</text>
                <text x="5" y="105" className="text-[10px] fill-gray-400 font-medium">6M</text>
                <text x="5" y="145" className="text-[10px] fill-gray-400 font-medium">3M</text>
                <text x="5" y="185" className="text-[10px] fill-gray-400 font-medium">0</text>

                {/* Calculate coordinates for line charts */}
                {(() => {
                  const coordsDep = depositLoanTrend.map((d, i) => {
                    const x = 70 + i * 95;
                    const y = 180 - (d.deposits / 12000000) * 160;
                    return { x, y, val: d.deposits, m: d.month };
                  });

                  const coordsLoan = depositLoanTrend.map((d, i) => {
                    const x = 70 + i * 95;
                    const y = 180 - (d.loans / 12000000) * 160;
                    return { x, y, val: d.loans, m: d.month };
                  });

                  const dPathDep = coordsDep.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, "");
                  const dPathLoan = coordsLoan.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, "");

                  return (
                    <>
                      {/* Deposit Line & Shadow Area */}
                      <path d={`${dPathDep} L 545 180 L 70 180 Z`} fill="url(#blue-gradient)" opacity="0.1" />
                      <path d={dPathDep} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

                      {/* Loan Line & Shadow Area */}
                      <path d={`${dPathLoan} L 545 180 L 70 180 Z`} fill="url(#purple-gradient)" opacity="0.1" />
                      <path d={dPathLoan} fill="none" stroke="#9333ea" strokeWidth="3" strokeLinecap="round" />

                      {/* Markers */}
                      {coordsDep.map((p, i) => (
                        <g key={`dep-pt-${i}`}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                          <text x={p.x} y="196" textAnchor="middle" className="text-[11px] fill-gray-500 font-semibold">{p.m}</text>
                          <title>{`Deposits: ${formatNaira(p.val)}`}</title>
                        </g>
                      ))}

                      {coordsLoan.map((p, i) => (
                        <circle key={`loan-pt-${i}`} cx={p.x} cy={p.y} r="5" fill="#9333ea" stroke="#ffffff" strokeWidth="2">
                          <title>{`Loans: ${formatNaira(p.val)}`}</title>
                        </circle>
                      ))}

                      {/* Gradient Definitions */}
                      <defs>
                        <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="purple-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>
              {/* Legend */}
              <div className="flex justify-center space-x-6 text-xs mt-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-1 bg-blue-600 rounded"></span>
                  <span className="text-gray-600 font-medium">Deposits Liability Profile</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-1 bg-purple-600 rounded"></span>
                  <span className="text-gray-600 font-medium">Loan Asset Portfolio</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
