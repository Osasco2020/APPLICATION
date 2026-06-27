/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Send,
  QrCode,
  CreditCard,
  Wifi,
  Tv,
  Zap,
  BookOpen,
  HelpCircle,
  Copy,
  PlusCircle,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  PhoneCall,
  UserCheck
} from "lucide-react";
import { SystemState, createAuditLog } from "../utils/state";
import {
  SavingsAccount,
  SavingsProductType,
  Transaction,
  TransactionType,
  AccountStatus
} from "../types";

interface FintechSimulatorProps {
  state: SystemState;
  onChangeState: (state: SystemState) => void;
  selectedCustomerId: string;
}

export default function FintechSimulator({
  state,
  onChangeState,
  selectedCustomerId
}: FintechSimulatorProps) {
  // Find current customer details
  const currentCustomer = state.customers.find((c) => c.id === selectedCustomerId) || state.customers[0];
  const customerAccounts = state.accounts.filter((a) => a.customerId === currentCustomer.id);

  // UI state
  const [activeAccount, setActiveAccount] = useState<SavingsAccount | null>(customerAccounts[0] || null);
  const [mobileScreen, setMobileScreen] = useState<"home" | "transfer" | "bills" | "ussd" | "card" | "qr">("home");
  const [alertText, setAlertText] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("success");

  // Transfer Form
  const [transferType, setTransferType] = useState<"internal" | "other">("internal");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDay, setScheduleDay] = useState("1");

  // Bills Form
  const [billCategory, setBillCategory] = useState<"airtime" | "data" | "electricity" | "cable" | "betting" | "school_fees">("airtime");
  const [billerProvider, setBillerProvider] = useState("");
  const [billDetails, setBillDetails] = useState(""); // Meter No, Smartcard No, Phone Number, etc.
  const [billAmount, setBillAmount] = useState("");

  // Card Management State
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [cardLimit, setCardLimit] = useState(150000);
  const [showCardNumber, setShowCardNumber] = useState(false);

  // USSD Simulator
  const [ussdInput, setUssdInput] = useState("*554#");
  const [ussdResponse, setUssdResponse] = useState<string | null>(null);

  // Refresh active account when state changes or on load
  useEffect(() => {
    if (customerAccounts.length > 0) {
      const match = customerAccounts.find(a => a.accountNumber === activeAccount?.accountNumber);
      setActiveAccount(match || customerAccounts[0]);
    }
  }, [state, selectedCustomerId]);

  const triggerAlert = (text: string, type: "success" | "error" | "info" = "success") => {
    setAlertText(text);
    setAlertType(type);
    setTimeout(() => {
      setAlertText(null);
    }, 5000);
  };

  // Autodetect Transfer Recipient
  useEffect(() => {
    if (transferType === "internal" && recipientAccount.length === 10) {
      const targetAcc = state.accounts.find(a => a.accountNumber === recipientAccount);
      if (targetAcc) {
        const targetCust = state.customers.find(c => c.id === targetAcc.customerId);
        if (targetCust) {
          setRecipientName(`${targetCust.firstName} ${targetCust.lastName}`);
          return;
        }
      }
      setRecipientName("Unknown Account - Please verify");
    } else {
      setRecipientName("");
    }
  }, [recipientAccount, transferType]);

  // Handle Opening a New Savings Product
  const handleCreateSavingsAccount = (product: SavingsProductType) => {
    // Check if customer already has this product
    const exists = customerAccounts.some(a => a.productType === product);
    if (exists) {
      triggerAlert(`You already have an active ${product} account.`, "error");
      return;
    }

    const newAccNum = "1010" + Math.floor(100000 + Math.random() * 900000).toString();
    const newAccount: SavingsAccount = {
      accountNumber: newAccNum,
      customerId: currentCustomer.id,
      productType: product,
      balance: 10000, // Open with dynamic 10,000 NGN bonus/gift
      status: AccountStatus.ACTIVE,
      interestRate: product === SavingsProductType.FIXED_DEPOSIT ? 0.08 : 0.04,
      openedAt: new Date().toISOString()
    };

    const updatedAccounts = [...state.accounts, newAccount];

    // Ledger deduction for the bonus
    const updatedLedgers = {
      ...state.ledgers,
      operatingExpenses: state.ledgers.operatingExpenses + 10000
    };

    // System transaction
    const newTxn: Transaction = {
      id: `TXN-${Date.now()}`,
      accountNumber: newAccNum,
      type: TransactionType.CASH_DEPOSIT,
      amount: 10000,
      fee: 0,
      reference: "SYS/BONUS/OPEN",
      date: new Date().toISOString(),
      postedBy: "SYSTEM",
      status: "Completed",
      note: `Onboarding bonus for opening ${product}`,
      isCash: false
    };

    const updatedLogs = [
      createAuditLog(currentCustomer.id, "Customer", "Account Created", `Opened new ${product} account (${newAccNum})`),
      ...state.auditLogs
    ];

    onChangeState({
      ...state,
      accounts: updatedAccounts,
      transactions: [newTxn, ...state.transactions],
      ledgers: updatedLedgers,
      auditLogs: updatedLogs
    });

    setActiveAccount(newAccount);
    triggerAlert(`Successfully opened your ${product}! A bonus of ₦10,000 has been credited.`, "success");
  };

  // Perform Bank Transfer
  const handlePerformTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerAlert("Please enter a valid amount.", "error");
      return;
    }

    if (activeAccount.balance < amount) {
      triggerAlert("Insufficient funds in selected account.", "error");
      return;
    }

    const fee = transferType === "internal" ? 0 : 25; // 25 NGN interbank charge
    const totalDeduction = amount + fee;

    if (activeAccount.balance < totalDeduction) {
      triggerAlert(`Insufficient funds to cover transaction and ₦${fee} network fee.`, "error");
      return;
    }

    // Process
    let updatedAccounts = [...state.accounts];
    const sourceIndex = updatedAccounts.findIndex(a => a.accountNumber === activeAccount.accountNumber);
    updatedAccounts[sourceIndex] = {
      ...updatedAccounts[sourceIndex],
      balance: updatedAccounts[sourceIndex].balance - totalDeduction
    };

    let destinationAccount: SavingsAccount | null = null;
    if (transferType === "internal") {
      const destIndex = updatedAccounts.findIndex(a => a.accountNumber === recipientAccount);
      if (destIndex !== -1) {
        updatedAccounts[destIndex] = {
          ...updatedAccounts[destIndex],
          balance: updatedAccounts[destIndex].balance + amount
        };
        destinationAccount = updatedAccounts[destIndex];
      } else {
        triggerAlert("Recipient account not found inside bank records.", "error");
        return;
      }
    }

    // Ledger impact
    let updatedLedgers = { ...state.ledgers };
    if (fee > 0) {
      updatedLedgers.feeIncome += fee;
    }

    // Record Transactions
    const sourceTxn: Transaction = {
      id: `TXN-WDR-${Date.now()}`,
      accountNumber: activeAccount.accountNumber,
      type: transferType === "internal" ? TransactionType.INTERNAL_FUND_TRANSFER : TransactionType.INTER_BRANCH_TRANSFER,
      amount: amount,
      fee: fee,
      reference: `TRF/${transferType === "internal" ? "INT" : "EXT"}/${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      postedBy: "CUSTOMER",
      status: "Completed",
      note: transferNote || `Transfer to ${recipientAccount} (${transferType === "internal" ? recipientName : "Other Bank"})`,
      isCash: false
    };

    let txns = [sourceTxn, ...state.transactions];

    if (transferType === "internal" && destinationAccount) {
      const destTxn: Transaction = {
        id: `TXN-DEP-${Date.now()}`,
        accountNumber: destinationAccount.accountNumber,
        type: TransactionType.INTERNAL_FUND_TRANSFER,
        amount: amount,
        fee: 0,
        reference: sourceTxn.reference,
        date: new Date().toISOString(),
        postedBy: "CUSTOMER",
        status: "Completed",
        note: `Transfer received from ${activeAccount.accountNumber} (${currentCustomer.firstName} ${currentCustomer.lastName})`,
        isCash: false
      };
      txns = [destTxn, ...txns];
    }

    const auditDesc = `Transferred ₦${amount.toLocaleString()} from ${activeAccount.accountNumber} to ${recipientAccount} (${transferType === "internal" ? recipientName : "External"})`;
    const updatedLogs = [
      createAuditLog(currentCustomer.id, "Customer", "Transfer Completed", auditDesc),
      ...state.auditLogs
    ];

    onChangeState({
      ...state,
      accounts: updatedAccounts,
      transactions: txns,
      ledgers: updatedLedgers,
      auditLogs: updatedLogs
    });

    // Reset Form
    setRecipientAccount("");
    setRecipientName("");
    setTransferAmount("");
    setTransferNote("");
    setMobileScreen("home");
    triggerAlert(`Transfer of ₦${amount.toLocaleString()} posted successfully!`, "success");
  };

  // Perform Bill Payment
  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerAlert("Please enter a valid amount.", "error");
      return;
    }

    if (activeAccount.balance < amount) {
      triggerAlert("Insufficient balance for this payment.", "error");
      return;
    }

    // Deduct
    const updatedAccounts = [...state.accounts];
    const idx = updatedAccounts.findIndex(a => a.accountNumber === activeAccount.accountNumber);
    updatedAccounts[idx] = {
      ...updatedAccounts[idx],
      balance: updatedAccounts[idx].balance - amount
    };

    const newTxn: Transaction = {
      id: `TXN-BILL-${Date.now()}`,
      accountNumber: activeAccount.accountNumber,
      type: TransactionType.CHARGES_POSTING,
      amount: amount,
      fee: 0,
      reference: `BILL/${billCategory.toUpperCase()}/${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      postedBy: "CUSTOMER",
      status: "Completed",
      note: `${billCategory.replace("_", " ").toUpperCase()} payment for ${billDetails} via ${billerProvider || "Digital Channel"}`,
      isCash: false
    };

    const updatedLogs = [
      createAuditLog(currentCustomer.id, "Customer", "Bill Payment", `Paid ₦${amount.toLocaleString()} for ${billCategory} provider ${billerProvider}`),
      ...state.auditLogs
    ];

    onChangeState({
      ...state,
      accounts: updatedAccounts,
      transactions: [newTxn, ...state.transactions],
      auditLogs: updatedLogs
    });

    setBillAmount("");
    setBillDetails("");
    setMobileScreen("home");
    triggerAlert(`Payment of ₦${amount.toLocaleString()} for ${billCategory.toUpperCase()} was successful!`, "success");
  };

  // Dial USSD Code Simulation
  const handleDialUssd = () => {
    if (ussdInput === "*554#") {
      setUssdResponse(
        `Osarumwense MFB\n1. Quick Balance\n2. Mini Statement\n3. Transfer Funds\n4. Buy Airtime`
      );
    } else if (ussdInput.startsWith("*554*1#")) {
      const balanceDetails = customerAccounts
        .map(a => `${a.productType.split(" ")[0]}: ₦${a.balance.toLocaleString()}`)
        .join("\n");
      setUssdResponse(`Your Balances:\n${balanceDetails}`);
    } else if (ussdInput.startsWith("*554*4*")) {
      // e.g. *554*4*1000# - Quick recharge
      const parts = ussdInput.split("*");
      const amtStr = parts[parts.length - 1].replace("#", "");
      const amount = parseFloat(amtStr);
      if (!isNaN(amount) && activeAccount && activeAccount.balance >= amount) {
        // Deduct
        const updatedAccounts = [...state.accounts];
        const idx = updatedAccounts.findIndex(a => a.accountNumber === activeAccount.accountNumber);
        updatedAccounts[idx] = {
          ...updatedAccounts[idx],
          balance: updatedAccounts[idx].balance - amount
        };

        const newTxn: Transaction = {
          id: `TXN-USSD-${Date.now()}`,
          accountNumber: activeAccount.accountNumber,
          type: TransactionType.CHARGES_POSTING,
          amount: amount,
          fee: 0,
          reference: `USSD/RECH/${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString(),
          postedBy: "CUSTOMER",
          status: "Completed",
          note: `Quick Airtime TopUp via USSD Dialing`,
          isCash: false
        };

        onChangeState({
          ...state,
          accounts: updatedAccounts,
          transactions: [newTxn, ...state.transactions],
          auditLogs: [createAuditLog(currentCustomer.id, "Customer", "USSD Transaction", `USSD Recharge of ₦${amount}`), ...state.auditLogs]
        });

        setUssdResponse(`Recharge of ₦${amount.toLocaleString()} successful! Dial *554*1# for new balance.`);
      } else {
        setUssdResponse("Transaction failed. Insufficient funds or invalid format.");
      }
    } else {
      setUssdResponse(
        `Welcome to Osarumwense Microfinance Bank USSD Banking.\nDial *554# to access your account menu directly.`
      );
    }
  };

  // Quick Card Actions
  const handleToggleCardFreeze = () => {
    setIsCardFrozen(!isCardFrozen);
    triggerAlert(`Debit Card has been ${!isCardFrozen ? "FROZEN" : "UNFROZEN"}.`, !isCardFrozen ? "info" : "success");
    onChangeState({
      ...state,
      auditLogs: [
        createAuditLog(currentCustomer.id, "Customer", "Card Action", `Card freeze status updated: ${!isCardFrozen}`),
        ...state.auditLogs
      ]
    });
  };

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAlert(`Daily Card limit set to ₦${cardLimit.toLocaleString()}`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Introduction text */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="flex items-center space-x-2.5 mb-3">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Mobile Simulator</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Welcome to the Consumer FinTech Interface. Here, you can interact with the app just like a client of **Osarumwense Microfinance Bank**.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">Active Client Identity</span>
            <div className="flex items-center space-x-3">
              <img
                src={currentCustomer.photoUrl}
                alt={currentCustomer.firstName}
                className="w-9 h-9 rounded-full bg-gray-200 border border-slate-200 object-cover"
              />
              <div>
                <span className="text-xs font-bold text-gray-800 block">
                  {currentCustomer.firstName} {currentCustomer.lastName}
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">ID: {currentCustomer.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick info about products */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wider">Product Options</h4>
          <div className="space-y-2.5">
            <button
              onClick={() => handleCreateSavingsAccount(SavingsProductType.UNION_PURSE)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-gray-800 block">Union Purse Savings</span>
                <span className="text-[10px] text-gray-400">High-yield micro-savings product</span>
              </div>
              <PlusCircle className="w-4 h-4 text-indigo-500" />
            </button>
            <button
              onClick={() => handleCreateSavingsAccount(SavingsProductType.TARGET)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-gray-800 block">Target Savings</span>
                <span className="text-[10px] text-gray-400">Commit to periodic goals (6% APR)</span>
              </div>
              <PlusCircle className="w-4 h-4 text-indigo-500" />
            </button>
            <button
              onClick={() => handleCreateSavingsAccount(SavingsProductType.MY_PIKIN)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-gray-800 block">My Pikin Savings</span>
                <span className="text-[10px] text-gray-400">Child security and educational vault</span>
              </div>
              <PlusCircle className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Phone Screen */}
      <div className="lg:col-span-8 flex justify-center">
        {/* Alerts within phone mockup */}
        <div className="relative w-full max-w-sm rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[9/18]">
          {/* Top Notch/Speaker */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-50 flex justify-center items-center">
            <div className="w-24 h-4 bg-black rounded-b-xl flex justify-between px-3 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
              <span className="w-8 h-1 bg-gray-800 rounded-full"></span>
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
            </div>
          </div>

          {/* Alert Notification Popup inside phone */}
          {alertText && (
            <div className={`absolute top-8 inset-x-3 z-50 rounded-xl p-3 shadow-lg border text-xs flex items-center space-x-2 transition-all ${
              alertType === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : alertType === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              {alertType === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span>{alertText}</span>
            </div>
          )}

          {/* Internal Content Frame */}
          <div className="w-full h-full bg-slate-50 pt-7 pb-4 flex flex-col justify-between overflow-y-auto">
            {/* Top Bar with battery etc */}
            <div className="px-5 py-1.5 flex justify-between items-center text-[11px] font-bold text-gray-400">
              <span>09:41</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-2 bg-gray-400 rounded-sm"></span>
                <span>LTE</span>
              </div>
            </div>

            {/* Main Application Interface */}
            <div className="flex-1 px-4 py-2 flex flex-col justify-between">
              {mobileScreen === "home" && (
                <div className="space-y-4">
                  {/* Greeting & Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Welcome back,</span>
                      <h2 className="text-base font-bold text-gray-800">
                        {currentCustomer.firstName} {currentCustomer.lastName}
                      </h2>
                    </div>
                    <div className="relative">
                      <Bell className="w-5 h-5 text-gray-400 cursor-pointer" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500"></span>
                    </div>
                  </div>

                  {/* Account Cards - Horizontal Scroll */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Accounts</span>
                    {customerAccounts.length > 0 ? (
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-5 -mr-4 -mb-4">
                          <CreditCard className="w-32 h-32" />
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold tracking-wide opacity-80">
                            {activeAccount?.productType || customerAccounts[0].productType}
                          </span>
                          <span className="text-[9px] bg-indigo-500/50 px-2 py-0.5 rounded-full border border-indigo-400/40">Active</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-60 block tracking-widest mb-2">
                          {activeAccount?.accountNumber || customerAccounts[0].accountNumber}
                        </span>
                        <h4 className="text-xl font-bold">
                          ₦{(activeAccount?.balance || customerAccounts[0].balance).toLocaleString()}
                        </h4>
                      </div>
                    ) : (
                      <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                        <p className="text-xs text-amber-800 font-medium">No savings products active yet. Open one to start!</p>
                      </div>
                    )}

                    {/* Quick Account Swapping selector */}
                    {customerAccounts.length > 1 && (
                      <div className="flex space-x-1 overflow-x-auto pb-1">
                        {customerAccounts.map((acc) => (
                          <button
                            key={acc.accountNumber}
                            onClick={() => setActiveAccount(acc)}
                            className={`px-2 py-1 text-[9px] font-bold rounded-full border whitespace-nowrap ${
                              activeAccount?.accountNumber === acc.accountNumber
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {acc.productType.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FinTech Quick Menu Buttons */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Fintech Actions</span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setMobileScreen("transfer")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-center transition"
                      >
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mb-1">
                          <Send className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">Send</span>
                      </button>

                      <button
                        onClick={() => setMobileScreen("bills")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-center transition"
                      >
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-1">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">Bills</span>
                      </button>

                      <button
                        onClick={() => setMobileScreen("card")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-center transition"
                      >
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-1">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">Card</span>
                      </button>

                      <button
                        onClick={() => setMobileScreen("ussd")}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-center transition"
                      >
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl mb-1">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">USSD</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity Mini List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Transactions</span>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                      {state.transactions
                        .filter(t => t.accountNumber === activeAccount?.accountNumber)
                        .slice(0, 3)
                        .map((t) => {
                          const isDr = t.type === TransactionType.CASH_WITHDRAWAL ||
                                       t.type === TransactionType.INTERNAL_FUND_TRANSFER ||
                                       t.type === TransactionType.INTER_BRANCH_TRANSFER ||
                                       t.type === TransactionType.CHARGES_POSTING ||
                                       t.type === TransactionType.EXPENSE_POSTING;
                          return (
                            <div key={t.id} className="p-3 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-800 block truncate">{t.note}</span>
                                <span className="text-[9px] text-gray-400 font-mono block">{new Date(t.date).toLocaleDateString()}</span>
                              </div>
                              <span className={`text-xs font-bold ml-2 ${isDr ? "text-rose-500" : "text-emerald-500"}`}>
                                {isDr ? "-" : "+"}₦{t.amount.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      {state.transactions.filter(t => t.accountNumber === activeAccount?.accountNumber).length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">No transactions recorded on this account.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Screen */}
              {mobileScreen === "transfer" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800">Transfer Funds</h3>
                    <button onClick={() => setMobileScreen("home")} className="text-xs font-semibold text-gray-400">Cancel</button>
                  </div>

                  <form onSubmit={handlePerformTransfer} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Recipient Institution</label>
                      <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200">
                        <button
                          type="button"
                          onClick={() => { setTransferType("internal"); setRecipientAccount(""); }}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                            transferType === "internal" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                          }`}
                        >
                          Internal Account
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTransferType("other"); setRecipientAccount("9991203945"); }}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                            transferType === "other" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                          }`}
                        >
                          Other Banks (NIP)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Account Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 1010001020"
                        value={recipientAccount}
                        onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                      {recipientName && (
                        <div className="mt-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded flex items-center space-x-1">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{recipientName}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Amount (NGN)</label>
                      <input
                        type="number"
                        placeholder="₦0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description / Memo</label>
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Standing Orders Scheduler Option */}
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isScheduled}
                          onChange={(e) => setIsScheduled(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-gray-600">Create Standing Order (Monthly)</span>
                      </label>
                      {isScheduled && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[9px] text-gray-400">Process on day of month:</span>
                          <select
                            value={scheduleDay}
                            onChange={(e) => setScheduleDay(e.target.value)}
                            className="bg-white border border-gray-200 text-[10px] rounded px-1 py-0.5 focus:outline-none"
                          >
                            <option value="1">1st</option>
                            <option value="5">5th</option>
                            <option value="15">15th</option>
                            <option value="28">28th</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition"
                    >
                      {isScheduled ? "Establish Standing Order" : "Confirm Transfer"}
                    </button>
                  </form>
                </div>
              )}

              {/* Bills Payment Screen */}
              {mobileScreen === "bills" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800">Utility & Bill Pay</h3>
                    <button onClick={() => setMobileScreen("home")} className="text-xs font-semibold text-gray-400">Cancel</button>
                  </div>

                  {/* Categories Selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "airtime", label: "Airtime", icon: Wifi },
                      { id: "electricity", label: "Power", icon: Zap },
                      { id: "cable", label: "Cable TV", icon: Tv },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setBillCategory(c.id as any);
                          setBillerProvider(c.id === "airtime" ? "MTN" : c.id === "electricity" ? "EEDC" : "DSTV");
                        }}
                        className={`p-2 flex flex-col items-center border rounded-lg text-center transition ${
                          billCategory === c.id
                            ? "border-indigo-500 bg-indigo-50/20 text-indigo-600"
                            : "border-gray-100 bg-white text-gray-500"
                        }`}
                      >
                        <c.icon className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-semibold">{c.label}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePayBill} className="space-y-3.5 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Service Provider</label>
                      <select
                        value={billerProvider}
                        onChange={(e) => setBillerProvider(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                      >
                        {billCategory === "airtime" && (
                          <>
                            <option value="MTN">MTN Nigeria</option>
                            <option value="Airtel">Airtel Nigeria</option>
                            <option value="Glo">Glo Mobile</option>
                            <option value="9mobile">9mobile</option>
                          </>
                        )}
                        {billCategory === "electricity" && (
                          <>
                            <option value="BEDC">Benin Disco (BEDC)</option>
                            <option value="EKEDC">Eko Disco (EKEDC)</option>
                            <option value="IKEDC">Ikeja Disco</option>
                          </>
                        )}
                        {billCategory === "cable" && (
                          <>
                            <option value="DSTV">DSTV Premium</option>
                            <option value="GOTV">GOTV Subscription</option>
                            <option value="StarTimes">StarTimes TV</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        {billCategory === "airtime" ? "Phone Number" : billCategory === "electricity" ? "Meter Number" : "Smartcard ID"}
                      </label>
                      <input
                        type="text"
                        placeholder={billCategory === "airtime" ? "+234803..." : "e.g. 450091827"}
                        value={billDetails}
                        onChange={(e) => setBillDetails(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Recharge Amount (NGN)</label>
                      <input
                        type="number"
                        placeholder="₦0"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition"
                    >
                      Authorize Payment
                    </button>
                  </form>
                </div>
              )}

              {/* USSD Simulator */}
              {mobileScreen === "ussd" && (
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-left">
                    <h3 className="text-xs font-bold text-gray-800">USSD Banking Tunnel</h3>
                    <button onClick={() => { setMobileScreen("home"); setUssdResponse(null); }} className="text-xs font-semibold text-gray-400">Exit</button>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-left text-green-400 space-y-3 relative overflow-hidden">
                    <span className="text-[9px] text-gray-500 block uppercase font-sans">Active USSD Buffer</span>
                    <input
                      type="text"
                      value={ussdInput}
                      onChange={(e) => setUssdInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 focus:outline-none text-sm font-bold tracking-wider"
                    />

                    {ussdResponse && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-sans">
                        {ussdResponse}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setUssdInput("*554#")}
                      className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold text-gray-700 transition"
                    >
                      Reset Core Menu
                    </button>
                    <button
                      onClick={handleDialUssd}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition"
                    >
                      Dial Command
                    </button>
                  </div>

                  <div className="text-left text-[10px] text-gray-400 leading-relaxed bg-slate-50 p-3 rounded-lg border border-gray-200">
                    <span className="font-semibold text-gray-600 uppercase block mb-1">Shortcut Commands:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Dial <code className="font-mono bg-white px-1 border border-gray-200 rounded font-bold">*554#</code> to explore general index menus.</li>
                      <li>Dial <code className="font-mono bg-white px-1 border border-gray-200 rounded font-bold">*554*1#</code> to query your digital balances instantly.</li>
                      <li>Dial <code className="font-mono bg-white px-1 border border-gray-200 rounded font-bold">*554*4*amount#</code> for quick airtime recharge (e.g. *554*4*1000#).</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Card Management */}
              {mobileScreen === "card" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800">Card Controls</h3>
                    <button onClick={() => setMobileScreen("home")} className="text-xs font-semibold text-gray-400">Back</button>
                  </div>

                  {/* Virtual Card Graphic */}
                  <div className={`relative h-36 rounded-2xl p-4 text-white shadow-md transition-all duration-300 ${
                    isCardFrozen
                      ? "bg-gradient-to-br from-slate-600 to-slate-800 opacity-60 filter grayscale"
                      : "bg-gradient-to-br from-slate-800 to-slate-900"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-semibold opacity-70 block uppercase tracking-wide">Osarumwense Microfinance</span>
                        <span className="text-[8px] opacity-50 font-medium">Debit Card</span>
                      </div>
                      <div className="w-6 h-4 bg-yellow-500 rounded opacity-80" />
                    </div>

                    <div className="mt-6">
                      <span className="text-xs font-mono tracking-widest block">
                        {showCardNumber ? "4532 9918 2743 0019" : "•••• •••• •••• 0019"}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between items-end">
                      <div>
                        <span className="text-[8px] opacity-40 uppercase block">Card Holder</span>
                        <span className="text-[10px] font-medium tracking-wide">
                          {currentCustomer.firstName.toUpperCase()} {currentCustomer.lastName.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] opacity-40 uppercase block">Expires</span>
                        <span className="text-[10px] font-mono font-medium">12/30</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Freeze slider */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Freeze Card</span>
                        <span className="text-[9px] text-gray-400">Temporarily block authorizations</span>
                      </div>
                      <button
                        onClick={handleToggleCardFreeze}
                        className={`w-10 h-5 rounded-full p-0.5 transition ${isCardFrozen ? "bg-indigo-600" : "bg-gray-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isCardFrozen ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    {/* Show Details slider */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Show Card Details</span>
                        <span className="text-[9px] text-gray-400">Reveal card number and code</span>
                      </div>
                      <button
                        onClick={() => setShowCardNumber(!showCardNumber)}
                        className={`w-10 h-5 rounded-full p-0.5 transition ${showCardNumber ? "bg-indigo-600" : "bg-gray-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showCardNumber ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    {/* Limit Slider */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">Daily Limit</span>
                          <span className="text-[9px] text-gray-400">Adjust ATM and POS thresholds</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">₦{cardLimit.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="1000000"
                        step="50000"
                        value={cardLimit}
                        onChange={(e) => setCardLimit(parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Virtual Home Button Bar */}
            <div className="pt-2 flex justify-center">
              <div
                onClick={() => setMobileScreen("home")}
                className="w-28 h-1 bg-gray-800 rounded-full cursor-pointer hover:bg-gray-500 transition"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
