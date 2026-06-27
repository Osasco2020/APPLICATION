/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Customer,
  SavingsAccount,
  Loan,
  Transaction,
  AuditLog,
  KYCStatus,
  AccountStatus,
  LoanStatus,
  SavingsProductType,
  LoanProductType,
  TransactionType,
} from "../types";

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "CUST001",
    bvn: "22234567891",
    nin: "98765432101",
    firstName: "Osas",
    lastName: "Evbuomwan",
    dob: "1988-04-12",
    gender: "Male",
    address: "12 Airport Road, Benin City, Edo State",
    phone: "+2348031112233",
    email: "osas.evbuomwan@gmail.com",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=150&q=80",
    employmentStatus: "Self-Employed",
    employerName: "Osas Agro Ventures",
    monthlyIncome: 450000,
    kycStatus: KYCStatus.VERIFIED,
    riskClass: "Low",
    registeredAt: "2026-01-10T09:00:00Z"
  },
  {
    id: "CUST002",
    bvn: "22255667788",
    nin: "98711223344",
    firstName: "Funke",
    lastName: "Adebayo",
    dob: "1994-11-23",
    gender: "Female",
    address: "45 Oba Adesida Road, Akure, Ondo State",
    phone: "+2348052223344",
    email: "funke.adebayo@outlook.com",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=150&q=80",
    employmentStatus: "Salaried",
    employerName: "Edo State Civil Service",
    monthlyIncome: 185000,
    kycStatus: KYCStatus.VERIFIED,
    riskClass: "Low",
    registeredAt: "2026-02-15T10:30:00Z"
  },
  {
    id: "CUST003",
    bvn: "22299887766",
    nin: "98755667788",
    firstName: "Aliyu",
    lastName: "Danladi",
    dob: "1990-07-05",
    gender: "Male",
    address: "102 Sapele Road, Benin City, Edo State",
    phone: "+2348123334455",
    email: "aliyu.danladi@yahoo.com",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=150&q=80",
    employmentStatus: "Unemployed",
    monthlyIncome: 35000,
    kycStatus: KYCStatus.VERIFIED,
    riskClass: "High",
    registeredAt: "2026-03-01T14:15:00Z"
  },
  {
    id: "CUST004",
    bvn: "22244332211",
    nin: "98744332211",
    firstName: "Chinedu",
    lastName: "Okonkwo",
    dob: "1985-09-15",
    gender: "Male",
    address: "88 Mission Road, Benin City, Edo State",
    phone: "+2348074445566",
    email: "chinedu.okonkwo@gmail.com",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=150&q=80",
    employmentStatus: "Self-Employed",
    employerName: "Okonkwo Logistics & Spares",
    monthlyIncome: 1200000,
    kycStatus: KYCStatus.VERIFIED,
    riskClass: "Medium",
    registeredAt: "2026-01-20T11:00:00Z"
  }
];

export const MOCK_ACCOUNTS: SavingsAccount[] = [
  {
    accountNumber: "1010001010",
    customerId: "CUST001",
    productType: SavingsProductType.UNION_PURSE,
    balance: 1450000,
    status: AccountStatus.ACTIVE,
    interestRate: 0.045,
    openedAt: "2026-01-10T09:15:00Z"
  },
  {
    accountNumber: "1010001011",
    customerId: "CUST001",
    productType: SavingsProductType.TARGET,
    balance: 500000,
    status: AccountStatus.ACTIVE,
    interestRate: 0.06,
    openedAt: "2026-01-15T11:00:00Z"
  },
  {
    accountNumber: "1010001020",
    customerId: "CUST002",
    productType: SavingsProductType.REGULAR,
    balance: 75000,
    status: AccountStatus.ACTIVE,
    interestRate: 0.03,
    openedAt: "2026-02-15T10:45:00Z"
  },
  {
    accountNumber: "1010001030",
    customerId: "CUST003",
    productType: SavingsProductType.MY_PIKIN,
    balance: 1500,
    status: AccountStatus.ACTIVE,
    interestRate: 0.05,
    openedAt: "2026-03-01T14:30:00Z"
  },
  {
    accountNumber: "1010001040",
    customerId: "CUST004",
    productType: SavingsProductType.EXPRESS,
    balance: 8900000,
    status: AccountStatus.ACTIVE,
    interestRate: 0.04,
    openedAt: "2026-01-20T11:15:00Z"
  }
];

export const MOCK_LOANS: Loan[] = [
  {
    id: "LOAN001",
    customerId: "CUST001",
    productType: LoanProductType.REGULAR,
    principal: 500000,
    balance: 125000,
    paidAmount: 375000,
    interestRate: 0.15,
    tenor: 6,
    monthlyRepayment: 95833,
    status: LoanStatus.DISBURSED,
    appliedAt: "2026-01-12T10:00:00Z",
    disbursedAt: "2026-01-13T14:00:00Z",
    riskRating: "B",
    creditScore: 720,
    guarantors: [
      {
        fullName: "Salami Johnson",
        bvn: "22211122233",
        nin: "98799988877",
        phone: "+2348039998887",
        address: "70 Sakponba Road, Benin City",
        employmentDetails: "Manager, Benin Electricity Distribution Co.",
        verified: true,
        creditScore: 680,
        existingExposure: 0,
        blacklistStatus: "Clean",
        qualifies: true
      }
    ]
  },
  {
    id: "LOAN002",
    customerId: "CUST002",
    productType: LoanProductType.SALARY,
    principal: 200000,
    balance: 200000,
    paidAmount: 0,
    interestRate: 0.12,
    tenor: 12,
    monthlyRepayment: 18667,
    status: LoanStatus.DISBURSED,
    appliedAt: "2026-02-16T12:00:00Z",
    disbursedAt: "2026-02-18T09:30:00Z",
    riskRating: "A",
    creditScore: 780,
    guarantors: [
      {
        fullName: "Agatha Adebayo",
        bvn: "22244455566",
        nin: "98733322211",
        phone: "+2348053332211",
        address: "45 Oba Adesida Road, Akure",
        employmentDetails: "Principal Teacher, Akure High School",
        verified: true,
        creditScore: 710,
        existingExposure: 150000,
        blacklistStatus: "Clean",
        qualifies: true
      }
    ]
  },
  {
    id: "LOAN003",
    customerId: "CUST003",
    productType: LoanProductType.EMERGENCY,
    principal: 50000,
    balance: 50000,
    paidAmount: 0,
    interestRate: 0.20,
    tenor: 2,
    monthlyRepayment: 30000,
    status: LoanStatus.DISBURSED,
    appliedAt: "2026-04-05T08:00:00Z",
    disbursedAt: "2026-04-05T16:00:00Z",
    riskRating: "E",
    creditScore: 540,
    guarantors: [
      {
        fullName: "Imasuen Peter",
        bvn: "22288877766",
        nin: "98722211100",
        phone: "+2348122211100",
        address: "14 Ekenwan Road, Benin City",
        employmentDetails: "Trader",
        verified: true,
        creditScore: 590,
        existingExposure: 0,
        blacklistStatus: "Clean",
        qualifies: true
      }
    ]
  },
  {
    id: "LOAN004",
    customerId: "CUST004",
    productType: LoanProductType.SME,
    principal: 5000000,
    balance: 5000000,
    paidAmount: 0,
    interestRate: 0.10,
    tenor: 24,
    monthlyRepayment: 250000,
    status: LoanStatus.APPROVED,
    appliedAt: "2026-06-20T10:00:00Z",
    riskRating: "A",
    creditScore: 810,
    cacNumber: "CAC-998877",
    rcNumber: "RC-1234567",
    bnNumber: "BN-987654",
    businessName: "Okonkwo Logistics & Spares",
    businessDocumentsUploaded: true,
    guarantors: [
      {
        fullName: "Chief Emeka Okafor",
        bvn: "22200011122",
        nin: "98700011122",
        phone: "+2348037778889",
        address: "22 Upper Mission Road, Benin City",
        employmentDetails: "MD, Okafor Motors Ltd",
        verified: true,
        creditScore: 790,
        existingExposure: 0,
        blacklistStatus: "Clean",
        qualifies: true
      }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN001",
    accountNumber: "1010001010",
    type: TransactionType.CASH_DEPOSIT,
    amount: 1000000,
    fee: 0,
    reference: "DEP/CASH/776523",
    date: "2026-01-10T10:00:00Z",
    postedBy: "SID001",
    status: "Completed",
    note: "Initial cash deposit OSAS EVBUOMWAN",
    isCash: true
  },
  {
    id: "TXN002",
    accountNumber: "1010001010",
    type: TransactionType.LOAN_DISBURSEMENT,
    amount: 500000,
    fee: 5000,
    reference: "LOAN/DISB/001",
    date: "2026-01-13T14:05:00Z",
    postedBy: "SID002",
    status: "Completed",
    note: "Loan disbursement for LOAN001",
    isCash: false
  },
  {
    id: "TXN003",
    accountNumber: "1010001010",
    type: TransactionType.LOAN_REPAYMENT,
    amount: 375000,
    fee: 0,
    reference: "LOAN/PAY/202",
    date: "2026-04-15T11:30:00Z",
    postedBy: "CUSTOMER",
    status: "Completed",
    note: "Bulk principal repayment OSAS EVBUOMWAN",
    isCash: false
  },
  {
    id: "TXN004",
    accountNumber: "1010001020",
    type: TransactionType.CASH_DEPOSIT,
    amount: 100000,
    fee: 0,
    reference: "DEP/CASH/889271",
    date: "2026-02-15T11:00:00Z",
    postedBy: "SID001",
    status: "Completed",
    note: "Cash Deposit FUNKE ADEBAYO",
    isCash: true
  },
  {
    id: "TXN005",
    accountNumber: "1010001020",
    type: TransactionType.CASH_WITHDRAWAL,
    amount: 25000,
    fee: 100,
    reference: "WTH/CASH/221345",
    date: "2026-03-10T15:20:00Z",
    postedBy: "SID001",
    status: "Completed",
    note: "Counter Withdrawal FUNKE ADEBAYO",
    isCash: true
  },
  {
    id: "TXN006",
    accountNumber: "1010001040",
    type: TransactionType.CASH_DEPOSIT,
    amount: 8900000,
    fee: 0,
    reference: "DEP/CASH/993847",
    date: "2026-01-20T11:30:00Z",
    postedBy: "SID001",
    status: "Completed",
    note: "Corporate Cash Deposit Chinedu Okonkwo",
    isCash: true
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "AUD001",
    timestamp: "2026-06-27T08:00:00Z",
    userId: "SID001",
    role: "Teller",
    action: "Drawer Opened",
    details: "Teller SID001 opened cash drawer with NGN 500,000.00",
    ipAddress: "192.168.1.50",
    status: "Success"
  },
  {
    id: "AUD002",
    timestamp: "2026-06-27T08:15:00Z",
    userId: "SID003",
    role: "Branch Manager",
    action: "System Login",
    details: "Manager login from Benin Main Branch terminal",
    ipAddress: "192.168.1.2",
    status: "Success"
  },
  {
    id: "AUD003",
    timestamp: "2026-06-27T08:22:00Z",
    userId: "SID002",
    role: "Loan Officer",
    action: "Guarantor Verification",
    details: "Performed Credit Score validation on Chief Emeka Okafor for LOAN004",
    ipAddress: "192.168.1.15",
    status: "Success"
  }
];

// Base General Ledger Accounts
export const MOCK_LEDGERS = {
  cashInVault: 15000000,
  depositsWithCBN: 25000000,
  commercialBankPlacements: 45000000,
  interestIncome: 845000,
  feeIncome: 125000,
  operatingExpenses: 340000,
  salariesAndWages: 210000,
  officeRent: 150000,
};
