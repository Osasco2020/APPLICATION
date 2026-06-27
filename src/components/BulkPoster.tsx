/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Sliders,
  Play,
  CheckCircle,
  FileSpreadsheet,
  PlusCircle,
  Users
} from "lucide-react";
import { SystemState, createAuditLog } from "../utils/state";
import {
  SavingsProductType,
  LoanProductType,
  Transaction,
  TransactionType,
  LoanStatus
} from "../types";

interface BulkPosterProps {
  state: SystemState;
  onChangeState: (state: SystemState) => void;
  activeStaffId: string;
}

export default function BulkPoster({
  state,
  onChangeState,
  activeStaffId
}: BulkPosterProps) {
  const [productType, setProductType] = useState<"savings" | "loans">("savings");
  const [selectedSavingsProduct, setSelectedSavingsProduct] = useState<SavingsProductType>(SavingsProductType.UNION_PURSE);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<LoanProductType>(LoanProductType.REGULAR);

  // Operation parameters
  const [actionType, setActionType] = useState<"interest" | "charge" | "repayment" | "collection">("interest");
  const [flatAmount, setFlatAmount] = useState("500");
  const [percentageRate, setPercentageRate] = useState("1.5");
  const [impactCount, setImpactCount] = useState(0);

  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<string | null>(null);

  // Calculate matching items count automatically when selections change
  useEffect(() => {
    if (productType === "savings") {
      const count = state.accounts.filter(
        a => a.productType === selectedSavingsProduct && a.status === "Active"
      ).length;
      setImpactCount(count);
      // Auto adjust appropriate actions
      if (actionType === "repayment") {
        setActionType("interest");
      }
    } else {
      const count = state.loans.filter(
        l => l.productType === selectedLoanProduct && (l.status === "Disbursed" || l.status === "Approved")
      ).length;
      setImpactCount(count);
      if (actionType === "interest" || actionType === "collection") {
        setActionType("repayment");
      }
    }
  }, [productType, selectedSavingsProduct, selectedLoanProduct, state.accounts, state.loans]);

  // Execute Bulk Posting Operations
  const handleExecuteBulkPosting = () => {
    if (impactCount === 0) {
      alert("No matching active accounts or loans found for this bulk posting.");
      return;
    }

    setIsProcessing(true);
    setCompletedSummary(null);

    // Simulate batch execution
    setTimeout(() => {
      let updatedAccounts = [...state.accounts];
      let updatedLoans = [...state.loans];
      let newTransactions: Transaction[] = [];
      let totalValue = 0;

      let ledgersUpdate = { ...state.ledgers };

      if (productType === "savings") {
        // Savings Batch
        updatedAccounts = state.accounts.map((acc) => {
          if (acc.productType === selectedSavingsProduct && acc.status === "Active") {
            let changeAmount = 0;
            let note = "";
            let txnType = TransactionType.CHARGES_POSTING;

            if (actionType === "interest") {
              const rate = parseFloat(percentageRate) / 100;
              changeAmount = parseFloat((acc.balance * rate).toFixed(2));
              note = `Bulk Interest Credit (${percentageRate}%) - ${selectedSavingsProduct}`;
              txnType = TransactionType.INTEREST_POSTING;
              totalValue += changeAmount;
              ledgersUpdate.operatingExpenses += changeAmount; // interest payout is expense
              return { ...acc, balance: acc.balance + changeAmount };
            } else if (actionType === "charge") {
              changeAmount = parseFloat(flatAmount);
              note = `Bulk Monthly Maintenance Charge - ${selectedSavingsProduct}`;
              txnType = TransactionType.CHARGES_POSTING;
              totalValue += changeAmount;
              ledgersUpdate.feeIncome += changeAmount; // charge is fee income
              return { ...acc, balance: Math.max(0, acc.balance - changeAmount) };
            } else if (actionType === "collection") {
              changeAmount = parseFloat(flatAmount);
              note = `Bulk Field Collection Savings Credit - ${selectedSavingsProduct}`;
              txnType = TransactionType.CASH_DEPOSIT;
              totalValue += changeAmount;
              ledgersUpdate.cashInVault += changeAmount; // physical collections deposit
              return { ...acc, balance: acc.balance + changeAmount };
            }
          }
          return acc;
        });

        // Insert matching Transaction ledgers
        state.accounts.forEach((acc) => {
          if (acc.productType === selectedSavingsProduct && acc.status === "Active") {
            let amount = 0;
            let type = TransactionType.CHARGES_POSTING;
            let note = "";

            if (actionType === "interest") {
              const rate = parseFloat(percentageRate) / 100;
              amount = parseFloat((acc.balance * rate).toFixed(2));
              type = TransactionType.INTEREST_POSTING;
              note = `Bulk Interest Credit (${percentageRate}%)`;
            } else if (actionType === "charge") {
              amount = parseFloat(flatAmount);
              type = TransactionType.CHARGES_POSTING;
              note = `Bulk Monthly Service Charge`;
            } else if (actionType === "collection") {
              amount = parseFloat(flatAmount);
              type = TransactionType.CASH_DEPOSIT;
              note = `Bulk Field Collection Deposit`;
            }

            newTransactions.push({
              id: `TXN-BLK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              accountNumber: acc.accountNumber,
              type,
              amount,
              fee: 0,
              reference: `BLK/POST/${Math.floor(100000 + Math.random() * 900000)}`,
              date: new Date().toISOString(),
              postedBy: activeStaffId,
              status: "Completed",
              note,
              isCash: actionType === "collection"
            });
          }
        });
      } else {
        // Loans Batch
        updatedLoans = state.loans.map((loan) => {
          if (loan.productType === selectedLoanProduct && (loan.status === "Disbursed" || loan.status === "Approved")) {
            let changeAmount = 0;

            if (actionType === "repayment") {
              // Post Bulk repayments
              changeAmount = Math.min(parseFloat(flatAmount), loan.balance);
              totalValue += changeAmount;
              ledgersUpdate.cashInVault += changeAmount; // collection repayment
              return {
                ...loan,
                balance: loan.balance - changeAmount,
                paidAmount: loan.paidAmount + changeAmount,
                status: loan.balance - changeAmount <= 0 ? LoanStatus.REPAID : loan.status
              };
            } else if (actionType === "charge") {
              // Post Penalty/Servicing charges onto loan balance
              changeAmount = parseFloat(flatAmount);
              totalValue += changeAmount;
              ledgersUpdate.interestIncome += changeAmount; // treated as loan fee/interest
              return {
                ...loan,
                balance: loan.balance + changeAmount
              };
            }
          }
          return loan;
        });

        // Insert Transaction listings
        state.loans.forEach((loan) => {
          if (loan.productType === selectedLoanProduct && (loan.status === "Disbursed" || loan.status === "Approved")) {
            let amount = 0;
            let type = TransactionType.LOAN_REPAYMENT;
            let note = "";

            if (actionType === "repayment") {
              amount = Math.min(parseFloat(flatAmount), loan.balance);
              type = TransactionType.LOAN_REPAYMENT;
              note = `Bulk Monthly Repayment Posted`;
            } else if (actionType === "charge") {
              amount = parseFloat(flatAmount);
              type = TransactionType.CHARGES_POSTING;
              note = `Bulk Penalty / Service Charge Added`;
            }

            // Find an account number for this customer to map the txn correctly
            const clientAcc = state.accounts.find(a => a.customerId === loan.customerId);

            newTransactions.push({
              id: `TXN-BLK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              accountNumber: clientAcc?.accountNumber || "",
              loanId: loan.id,
              type,
              amount,
              fee: 0,
              reference: `BLK/POST/${Math.floor(100000 + Math.random() * 900000)}`,
              date: new Date().toISOString(),
              postedBy: activeStaffId,
              status: "Completed",
              note,
              isCash: actionType === "repayment"
            });
          }
        });
      }

      // Generate complete Audit trace
      const auditDesc = `Bulk posted ${actionType.toUpperCase()} on ${impactCount} matching ${
        productType === "savings" ? selectedSavingsProduct : selectedLoanProduct
      } accounts. Total impact value: ₦${totalValue.toLocaleString()}`;

      const updatedLogs = [
        createAuditLog(activeStaffId, "Operations Officer", "Bulk Posting", auditDesc),
        ...state.auditLogs
      ];

      onChangeState({
        ...state,
        accounts: updatedAccounts,
        loans: updatedLoans,
        transactions: [...newTransactions, ...state.transactions],
        ledgers: ledgersUpdate,
        auditLogs: updatedLogs
      });

      setIsProcessing(false);
      setCompletedSummary(
        `SUCCESS: Bulk operation completed! Processed ${impactCount} records. Total transaction value computed: ₦${totalValue.toLocaleString()}`
      );
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
      {/* Introduction header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Sliders className="w-5 h-5 mr-2 text-indigo-600 animate-pulse" /> Bulk Transaction Posting Hub
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Perform automated batch updates, interest credits, maintenance charges, or periodic repayment bookings across specified product lines simultaneously.
        </p>
      </div>

      {/* Target Module selection */}
      <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200/50 max-w-sm">
        <button
          onClick={() => setProductType("savings")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            productType === "savings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          Savings Product Line
        </button>
        <button
          onClick={() => setProductType("loans")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            productType === "loans" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          Loan Portfolio Line
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left selector panel */}
        <div className="space-y-4">
          {productType === "savings" ? (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Savings Product Class</label>
              <select
                value={selectedSavingsProduct}
                onChange={(e) => setSelectedSavingsProduct(e.target.value as SavingsProductType)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {Object.values(SavingsProductType).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Loan Product Class</label>
              <select
                value={selectedLoanProduct}
                onChange={(e) => setSelectedLoanProduct(e.target.value as LoanProductType)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {Object.values(LoanProductType).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action configurations */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Batch Operation Action</label>
            <div className="space-y-2">
              {productType === "savings" ? (
                <>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="savings_action"
                      checked={actionType === "interest"}
                      onChange={() => setActionType("interest")}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Post Interest Yield Credit (%)</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="savings_action"
                      checked={actionType === "charge"}
                      onChange={() => setActionType("charge")}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Post Service Maintenance Fee Charge (₦)</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="savings_action"
                      checked={actionType === "collection"}
                      onChange={() => setActionType("collection")}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Post Daily Bulk Field Collection Deposits (₦)</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="loan_action"
                      checked={actionType === "repayment"}
                      onChange={() => setActionType("repayment")}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Record Monthly Installment Repayment Collection (₦)</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="loan_action"
                      checked={actionType === "charge"}
                      onChange={() => setActionType("charge")}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Debit Monthly Penalty Administration Charges (₦)</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Value Inputs */}
          {actionType === "interest" ? (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Percentage Credit Rate (%)</label>
              <input
                type="number"
                step="0.05"
                value={percentageRate}
                onChange={(e) => setPercentageRate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Flat Amount per Account / Asset (₦)</label>
              <input
                type="number"
                value={flatAmount}
                onChange={(e) => setFlatAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Right Execution Monitor panel */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pre-Execution Matrix</span>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Matching Product Category:</span>
                <span className="font-bold text-gray-800">
                  {productType === "savings" ? selectedSavingsProduct : selectedLoanProduct}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Total Qualifying Active Portfolios:</span>
                <span className="font-bold text-indigo-600 flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1" /> {impactCount} accounts
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Selected Execution Operation:</span>
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wide">
                  {actionType} {actionType === "interest" ? `(${percentageRate}%)` : `(₦${flatAmount})`}
                </span>
              </div>
            </div>

            {completedSummary && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-semibold rounded-lg leading-relaxed">
                {completedSummary}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              disabled={impactCount === 0 || isProcessing}
              onClick={handleExecuteBulkPosting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center space-x-2 transition"
            >
              <Play className="w-4 h-4" />
              <span>{isProcessing ? "Processing Batch Pipeline..." : "Commit Batch Bulk Posting"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
