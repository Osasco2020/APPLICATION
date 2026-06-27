/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  User,
  Plus,
  Trash2,
  CheckCircle,
  Percent,
  Calculator,
  AlertCircle,
  FileText
} from "lucide-react";
import { SystemState, createAuditLog } from "../utils/state";
import {
  Loan,
  LoanProductType,
  LoanStatus,
  Guarantor,
  Customer,
  KYCStatus
} from "../types";

interface LoanOriginationProps {
  state: SystemState;
  onChangeState: (state: SystemState) => void;
  selectedCustomerId: string;
}

export default function LoanOrigination({
  state,
  onChangeState,
  selectedCustomerId
}: LoanOriginationProps) {
  // Wizard steps: 1 = Client Info, 2 = Loan Details, 3 = Guarantors, 4 = Credit scoring engine, 5 = Finished/Summary
  const [step, setStep] = useState(1);
  const [bvnOrNinInput, setBvnOrNinInput] = useState("");
  const [clientProfile, setClientProfile] = useState<Customer | null>(null);

  // Loan Details Form
  const [loanProduct, setLoanProduct] = useState<LoanProductType>(LoanProductType.REGULAR);
  const [requestedPrincipal, setRequestedPrincipal] = useState(250000);
  const [requestedTenor, setRequestedTenor] = useState(6); // Months

  // SME Fields (Applies if >= N3,000,000)
  const isSmeThreshold = requestedPrincipal >= 3000000;
  const [cacNumber, setCacNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [bnNumber, setBnNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [docsUploaded, setDocsUploaded] = useState(false);

  // Guarantor list
  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    {
      fullName: "",
      bvn: "",
      nin: "",
      phone: "",
      address: "",
      employmentDetails: "",
      verified: false,
      creditScore: 0,
      existingExposure: 0,
      blacklistStatus: "Clean",
      qualifies: false
    }
  ]);

  // Credit Engine Output
  const [scoreMetrics, setScoreMetrics] = useState({
    clientScore: 680,
    guarantorScore: 0,
    overallScore: 680,
    debtToIncomeRatio: 0,
    maxEligibleAmount: 500000,
    assignedRate: 0.15,
    monthlyRepayment: 0,
    riskRating: "B" as "A" | "B" | "C" | "D" | "E" | "F",
    recommendation: ""
  });

  const [wizardComplete, setWizardComplete] = useState(false);

  // Auto-load selected customer from parent when it changes
  useEffect(() => {
    if (selectedCustomerId) {
      const match = state.customers.find(c => c.id === selectedCustomerId);
      if (match) {
        setClientProfile(match);
        setBvnOrNinInput(match.bvn);
      }
    }
  }, [selectedCustomerId, state.customers]);

  // Search profile via BVN or NIN
  const handleVerifyClient = () => {
    if (!bvnOrNinInput.trim()) return;

    const match = state.customers.find(
      (c) => c.bvn === bvnOrNinInput.trim() || c.nin === bvnOrNinInput.trim()
    );

    if (match) {
      setClientProfile(match);
    } else {
      // Create a nice mock customer automatically based on search
      const mockNewCust: Customer = {
        id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        bvn: bvnOrNinInput.length === 11 ? bvnOrNinInput : "222" + Math.floor(10000000 + Math.random() * 90000000),
        nin: bvnOrNinInput.length === 11 ? "987" + Math.floor(10000000 + Math.random() * 90000000) : bvnOrNinInput,
        firstName: "Tunde",
        lastName: "Balogun",
        dob: "1992-05-18",
        gender: "Male",
        address: "56 Benin-Agbor Expressway, Benin City",
        phone: "+2348035554433",
        email: "tunde.balogun@outlook.com",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        signatureUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=150&q=80",
        employmentStatus: "Salaried",
        employerName: "Benin City Brewery",
        monthlyIncome: 350000,
        kycStatus: KYCStatus.VERIFIED,
        riskClass: "Low",
        registeredAt: new Date().toISOString()
      };
      setClientProfile(mockNewCust);
      // Auto register to system so database is updated
      onChangeState({
        ...state,
        customers: [...state.customers, mockNewCust]
      });
    }
  };

  // Add guarantor
  const addGuarantorRow = () => {
    setGuarantors([
      ...guarantors,
      {
        fullName: "",
        bvn: "",
        nin: "",
        phone: "",
        address: "",
        employmentDetails: "",
        verified: false,
        creditScore: 0,
        existingExposure: 0,
        blacklistStatus: "Clean",
        qualifies: false
      }
    ]);
  };

  // Remove guarantor
  const removeGuarantorRow = (idx: number) => {
    if (guarantors.length === 1) return;
    setGuarantors(guarantors.filter((_, i) => i !== idx));
  };

  // Edit guarantor input
  const updateGuarantorValue = (idx: number, field: keyof Guarantor, val: any) => {
    const list = [...guarantors];
    list[idx] = {
      ...list[idx],
      [field]: val
    };
    setGuarantors(list);
  };

  // Simulate guarantor validation (BVN, NIN, Credit Score)
  const verifyGuarantorRecord = (idx: number) => {
    const g = guarantors[idx];
    if (!g.fullName || !g.bvn || !g.nin) {
      alert("Please enter Name, BVN and NIN first before verifying.");
      return;
    }

    // High fidelity mock check
    const seed = parseInt(g.bvn.slice(-2)) || 50;
    const creditScore = 550 + (seed % 250); // range 550 to 800
    const blacklist = seed % 13 === 0 ? "Blacklisted" as const : "Clean" as const;
    const existingExposure = (seed % 4) * 100000;
    const qualifies = creditScore >= 600 && blacklist === "Clean" && existingExposure < 500000;

    updateGuarantorValue(idx, "creditScore", creditScore);
    updateGuarantorValue(idx, "blacklistStatus", blacklist);
    updateGuarantorValue(idx, "existingExposure", existingExposure);
    updateGuarantorValue(idx, "verified", true);
    updateGuarantorValue(idx, "qualifies", qualifies);
  };

  // Run the credit scoring engine calculation
  const runCreditScoringEngine = () => {
    if (!clientProfile) return;

    // Client score base
    let baseScore = clientProfile.riskClass === "Low" ? 720 : clientProfile.riskClass === "Medium" ? 640 : 530;
    if (clientProfile.employmentStatus === "Salaried") baseScore += 40;
    if (clientProfile.monthlyIncome > 500000) baseScore += 30;

    // Avg Guarantor score
    const validGuarantors = guarantors.filter(g => g.verified);
    const avgGuarantorScore = validGuarantors.length > 0
      ? validGuarantors.reduce((sum, g) => sum + g.creditScore, 0) / validGuarantors.length
      : 600;

    const overallScore = Math.min(Math.floor((baseScore * 0.6) + (avgGuarantorScore * 0.4)), 850);

    // Max Eligible amount calculation (based on income & scoring)
    const factor = overallScore > 750 ? 5 : overallScore > 650 ? 3.5 : 2;
    const maxEligibleAmount = Math.floor(clientProfile.monthlyIncome * factor);

    // Interest rate determination
    const assignedRate = overallScore > 750 ? 0.11 : overallScore > 650 ? 0.14 : 0.18;

    // Monthly repayment calculations (using simple interest for microfinance speed)
    const totalInterest = requestedPrincipal * assignedRate * (requestedTenor / 12);
    const monthlyRepayment = Math.floor((requestedPrincipal + totalInterest) / requestedTenor);

    // Debt-to-income (Monthly Repayment vs Client Monthly Income)
    const debtToIncomeRatio = monthlyRepayment / clientProfile.monthlyIncome;

    // Risk Rating
    let riskRating: "A" | "B" | "C" | "D" | "E" | "F" = "C";
    if (overallScore > 780) riskRating = "A";
    else if (overallScore > 710) riskRating = "B";
    else if (overallScore > 650) riskRating = "C";
    else if (overallScore > 580) riskRating = "D";
    else if (overallScore > 500) riskRating = "E";
    else riskRating = "F";

    // Recommendation logic
    let recommendation = "";
    if (riskRating === "F" || debtToIncomeRatio > 0.45) {
      recommendation = "REJECTED: High debt-to-income or substandard credit profile.";
    } else if (requestedPrincipal > maxEligibleAmount) {
      recommendation = `RECOMMENDED REDUCTION: Limit requested principal to maximum of ₦${maxEligibleAmount.toLocaleString()}.`;
    } else {
      recommendation = "APPROVED: Strong applicant matrix and fully qualified guarantors.";
    }

    setScoreMetrics({
      clientScore: baseScore,
      guarantorScore: Math.floor(avgGuarantorScore),
      overallScore,
      debtToIncomeRatio,
      maxEligibleAmount,
      assignedRate,
      monthlyRepayment,
      riskRating,
      recommendation
    });
  };

  // Submit loan application to core bank records
  const handleFinalSubmit = () => {
    if (!clientProfile) return;

    const isAppApproved = scoreMetrics.recommendation.startsWith("APPROVED");

    const newLoan: Loan = {
      id: `LOAN-${Date.now()}`,
      customerId: clientProfile.id,
      productType: loanProduct,
      principal: requestedPrincipal,
      balance: requestedPrincipal,
      paidAmount: 0,
      interestRate: scoreMetrics.assignedRate,
      tenor: requestedTenor,
      monthlyRepayment: scoreMetrics.monthlyRepayment,
      status: isAppApproved ? LoanStatus.APPROVED : LoanStatus.APPLIED,
      appliedAt: new Date().toISOString(),
      riskRating: scoreMetrics.riskRating,
      creditScore: scoreMetrics.overallScore,
      guarantors: guarantors.filter(g => g.verified),
      ...(isSmeThreshold ? {
        cacNumber,
        rcNumber,
        bnNumber,
        businessName: businessName || clientProfile.employerName,
        businessDocumentsUploaded: docsUploaded
      } : {})
    };

    const updatedLoans = [...state.loans, newLoan];
    const auditMsg = `Processed Digital Loan Application for ${clientProfile.firstName} ${clientProfile.lastName}. Status: ${newLoan.status}, Principal: ₦${requestedPrincipal.toLocaleString()}`;

    onChangeState({
      ...state,
      loans: updatedLoans,
      auditLogs: [createAuditLog("SYSTEM", "Credit Engine", "Loan Evaluated", auditMsg), ...state.auditLogs]
    });

    setWizardComplete(true);
  };

  const handleReset = () => {
    setStep(1);
    setBvnOrNinInput("");
    setClientProfile(null);
    setRequestedPrincipal(250000);
    setRequestedTenor(6);
    setCacNumber("");
    setRcNumber("");
    setBnNumber("");
    setBusinessName("");
    setDocsUploaded(false);
    setGuarantors([
      {
        fullName: "",
        bvn: "",
        nin: "",
        phone: "",
        address: "",
        employmentDetails: "",
        verified: false,
        creditScore: 0,
        existingExposure: 0,
        blacklistStatus: "Clean",
        qualifies: false
      }
    ]);
    setWizardComplete(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      {/* Step Progress indicators */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6 overflow-x-auto">
        {[
          { num: 1, label: "Client ID" },
          { num: 2, label: "Details" },
          { num: 3, label: "Guarantors" },
          { num: 4, label: "Credit Score" },
          { num: 5, label: "Finish" }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2 shrink-0 pr-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.num
                ? "bg-indigo-600 text-white"
                : step > s.num
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-400"
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-semibold ${step === s.num ? "text-gray-800" : "text-gray-400"}`}>
              {s.label}
            </span>
            {s.num < 5 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
          </div>
        ))}
      </div>

      {wizardComplete ? (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Application Submitted!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Your digital loan portfolio application has been analyzed. Qualifiers have been appended to active queues for final disbursal.
            </p>
          </div>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              Apply for Another Loan
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Step 1: BVN / NIN Verification & Lookup */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Step 1: Onboard Search Verification</h3>
                <p className="text-xs text-gray-500">Provide customer BVN or NIN to automatically fetch profile details</p>
              </div>

              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="Enter 11-digit BVN or NIN (e.g. 22234567891)"
                    value={bvnOrNinInput}
                    onChange={(e) => setBvnOrNinInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleVerifyClient}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  Verify Verification Hub
                </button>
              </div>

              {clientProfile && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Retrieved Customer File</span>
                  <div className="flex items-start space-x-4">
                    <img
                      src={clientProfile.photoUrl}
                      alt={clientProfile.firstName}
                      className="w-16 h-16 rounded-lg bg-gray-200 object-cover border border-slate-200"
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Full Name:</span>
                        <span className="font-bold text-gray-800">{clientProfile.firstName} {clientProfile.lastName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Date of Birth:</span>
                        <span className="font-medium text-gray-700">{clientProfile.dob}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Gender:</span>
                        <span className="font-medium text-gray-700">{clientProfile.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Phone Number:</span>
                        <span className="font-medium text-gray-700 font-mono">{clientProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Residential Address:</span>
                        <span className="font-medium text-gray-700 col-span-2">{clientProfile.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Employment Detail:</span>
                        <span className="font-bold text-indigo-700">{clientProfile.employmentStatus} ({clientProfile.employerName || "N/A"})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>NIN & BVN matched successfully. Live signatures uploaded.</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!clientProfile}
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition"
                >
                  <span>Proceed to Parameters</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Loan Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Step 2: Define Loan Parameters</h3>
                <p className="text-xs text-gray-500">Choose category product and financing quantum</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Loan Category Product</label>
                  <select
                    value={loanProduct}
                    onChange={(e) => setLoanProduct(e.target.value as LoanProductType)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(LoanProductType).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Requested Principal (₦)</label>
                  <input
                    type="number"
                    value={requestedPrincipal}
                    onChange={(e) => setRequestedPrincipal(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Loan Tenor (Months)</label>
                  <input
                    type="range"
                    min="1"
                    max="36"
                    value={requestedTenor}
                    onChange={(e) => setRequestedTenor(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-2"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 mt-1">
                    <span>1 Month</span>
                    <span className="text-indigo-600 font-bold">{requestedTenor} Months</span>
                    <span>36 Months</span>
                  </div>
                </div>
              </div>

              {/* SME verification panel if amount >= N3,000,000 */}
              {isSmeThreshold && (
                <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
                    <span className="text-xs font-bold">SME Regulatory Verification Required (&gt;= ₦3,000,000)</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Loans in excess of regulatory thresholds require corporate registration and company profiles.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Corporate CAC Registration No.</label>
                      <input
                        type="text"
                        placeholder="e.g. CAC-887711"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">RC Number / BN Number</label>
                      <input
                        type="text"
                        placeholder="e.g. RC-1234567"
                        value={rcNumber}
                        onChange={(e) => setRcNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Registered Business Entity Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Balogun Ventures Ltd"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none col-span-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setDocsUploaded(true)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition ${
                        docsUploaded
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {docsUploaded ? "✓ Business Records Uploaded" : "Upload Business Profile & ID"}
                    </button>
                    <span className="text-[10px] text-gray-400">Requires director signatures</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <span>Proceed to Guarantors</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Guarantor Management */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Step 3: Guarantor Management</h3>
                  <p className="text-xs text-gray-500">Provide guarantor details (Minimum of 1, unlimited support)</p>
                </div>
                <button
                  onClick={addGuarantorRow}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Guarantor</span>
                </button>
              </div>

              {guarantors.map((g, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 relative">
                  {guarantors.length > 1 && (
                    <button
                      onClick={() => removeGuarantorRow(idx)}
                      className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Guarantor Profile #{idx + 1}</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-0.5">Full Name</label>
                      <input
                        type="text"
                        value={g.fullName}
                        onChange={(e) => updateGuarantorValue(idx, "fullName", e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-none text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-0.5">BVN (11 Digits)</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={g.bvn}
                        onChange={(e) => updateGuarantorValue(idx, "bvn", e.target.value.replace(/\D/g, ""))}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-0.5">NIN (11 Digits)</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={g.nin}
                        onChange={(e) => updateGuarantorValue(idx, "nin", e.target.value.replace(/\D/g, ""))}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-0.5">Phone Number</label>
                      <input
                        type="text"
                        value={g.phone}
                        onChange={(e) => updateGuarantorValue(idx, "phone", e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-0.5">Employment details</label>
                      <input
                        type="text"
                        value={g.employmentDetails}
                        onChange={(e) => updateGuarantorValue(idx, "employmentDetails", e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-none text-xs col-span-1"
                      />
                    </div>
                  </div>

                  {/* Verification Results inside Box */}
                  <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-3 items-center justify-between">
                    <button
                      type="button"
                      onClick={() => verifyGuarantorRecord(idx)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition"
                    >
                      {g.verified ? "Recheck Verification Hub" : "Run Verification (Credit Score & Blacklist)"}
                    </button>

                    {g.verified && (
                      <div className="flex items-center space-x-3 text-[10px] font-semibold">
                        <span className="flex items-center text-gray-500">
                          Credit Score: <b className="text-gray-800 ml-1">{g.creditScore}</b>
                        </span>
                        <span className="flex items-center text-gray-500">
                          Status: <b className={`ml-1 ${g.blacklistStatus === "Clean" ? "text-emerald-600" : "text-rose-600"}`}>{g.blacklistStatus}</b>
                        </span>
                        <span className="flex items-center text-gray-500">
                          Active Loans: <b className="text-gray-800 ml-1">₦{g.existingExposure.toLocaleString()}</b>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${g.qualifies ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                          {g.qualifies ? "✓ Qualifies" : "✗ Disqualified"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  disabled={guarantors.some(g => !g.verified)}
                  onClick={() => {
                    runCreditScoringEngine();
                    setStep(4);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <span>Evaluate Credit Score</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Credit Scoring Engine Results */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                  <Calculator className="w-5 h-5 mr-1 text-indigo-500" /> Automated Credit Engine Analysis
                </h3>
                <p className="text-xs text-gray-500">Multivariant risk parameters scoring output</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Composite Score</span>
                  <h4 className="text-3xl font-extrabold text-indigo-600 mt-1">{scoreMetrics.overallScore}</h4>
                  <span className="text-[10px] text-gray-500 mt-1 block">Risk Rating: <b className="text-gray-800">{scoreMetrics.riskRating}</b></span>
                </div>

                {/* Debt to Income */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Debt-to-Income Ratio</span>
                  <h4 className={`text-3xl font-extrabold mt-1 ${(scoreMetrics.debtToIncomeRatio * 100) > 40 ? "text-rose-600" : "text-emerald-600"}`}>
                    {(scoreMetrics.debtToIncomeRatio * 100).toFixed(1)}%
                  </h4>
                  <span className="text-[10px] text-gray-500 mt-1 block">Threshold Limit: 45.0%</span>
                </div>

                {/* Maximum Limit */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Max Eligible Financing</span>
                  <h4 className="text-xl font-bold text-gray-800 mt-2">₦{scoreMetrics.maxEligibleAmount.toLocaleString()}</h4>
                  <span className="text-[10px] text-gray-500 mt-1 block">Based on verified salary metrics</span>
                </div>
              </div>

              {/* Dynamic Repayment Schedule */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800 flex items-center">
                    <Percent className="w-4 h-4 mr-1 text-gray-400" /> Pricing Schedule & Terms
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                    Interest Rate: {(scoreMetrics.assignedRate * 100).toFixed(1)}% APR
                  </span>
                </div>
                <div className="p-4 bg-white space-y-3 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Requested Financing Quantum:</span>
                    <span className="font-bold text-gray-800">₦{requestedPrincipal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repayment Horizon (Tenor):</span>
                    <span className="font-medium text-gray-800">{requestedTenor} Months</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-100 pt-2.5 font-semibold text-gray-800 text-sm">
                    <span>Estimated Monthly Obligation:</span>
                    <span className="text-indigo-600 font-extrabold">₦{scoreMetrics.monthlyRepayment.toLocaleString()} / mo</span>
                  </div>
                </div>
              </div>

              {/* Decision and Recommendations Box */}
              <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                scoreMetrics.recommendation.startsWith("APPROVED")
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : scoreMetrics.recommendation.startsWith("RECOMMENDED")
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                {scoreMetrics.recommendation.startsWith("APPROVED") ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold uppercase tracking-wide">Eligibility Rating Summary</h4>
                  <p className="mt-1 leading-relaxed">{scoreMetrics.recommendation}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition"
                >
                  Lock In & Submit Portfolio
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
