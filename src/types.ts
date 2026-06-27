/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum KYCStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected"
}

export enum AccountStatus {
  ACTIVE = "Active",
  DORMANT = "Dormant",
  CLOSED = "Closed"
}

export enum LoanStatus {
  APPLIED = "Applied",
  APPROVED = "Approved",
  DISBURSED = "Disbursed",
  REJECTED = "Rejected",
  REPAID = "Repaid"
}

export enum SavingsProductType {
  UNION_PURSE = "Union Purse Savings",
  REGULAR = "Regular Savings",
  VOLUNTARY = "Voluntary Savings",
  EXPRESS = "Express Savings",
  MY_PIKIN = "My Pikin Savings",
  FESTIVAL = "Festival Savings",
  ASSET = "Asset Savings",
  TARGET = "Target Savings",
  FIXED_DEPOSIT = "Fixed Deposit"
}

export enum LoanProductType {
  REGULAR = "Regular Loan",
  MID_TERM = "Mid-Term Loan",
  SME = "SME Loan",
  SMALL_BUSINESS = "Small Business Loan",
  EDUCATIONAL = "Educational Loan",
  SCHOOL_FEES = "School Fees Loan",
  ENERGY = "Energy Loan",
  ASSET = "Asset Loan",
  DBN = "DBN Loan",
  SPECIAL = "Special Loan",
  SUFEN = "Sufen Loan",
  COOPERATIVE = "Cooperative Loan",
  GROUP = "Group Loan",
  SALARY = "Salary Loan",
  AGRICULTURAL = "Agricultural Loan",
  EMERGENCY = "Emergency Loan"
}

export enum TransactionType {
  CASH_DEPOSIT = "Cash Deposit",
  CASH_WITHDRAWAL = "Cash Withdrawal",
  LOAN_DISBURSEMENT = "Loan Disbursement",
  LOAN_REPAYMENT = "Loan Repayment",
  INTEREST_POSTING = "Interest Posting",
  CHARGES_POSTING = "Charges Posting",
  INCOME_POSTING = "Income Posting",
  EXPENSE_POSTING = "Expense Posting",
  BANK_DEPOSIT = "Bank Deposit",
  BANK_WITHDRAWAL = "Bank Withdrawal",
  JOURNAL_POSTING = "Journal Posting",
  REVERSAL = "Reversal",
  INTER_BRANCH_TRANSFER = "Inter-Branch Transfer",
  INTERNAL_FUND_TRANSFER = "Internal Fund Transfer"
}

export enum StaffRole {
  RELATIONSHIP_OFFICER = "Relationship Officer",
  MARKETING_OFFICER = "Marketing Officer",
  LOAN_OFFICER = "Loan Officer",
  TELLER = "Teller",
  OPERATIONS_OFFICER = "Operations Officer",
  BRANCH_MANAGER = "Branch Manager",
  CREDIT_OFFICER = "Credit Officer",
  INTERNAL_AUDITOR = "Internal Auditor",
  SYSTEM_ADMINISTRATOR = "System Administrator"
}

export interface Customer {
  id: string;
  bvn: string;
  nin: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  photoUrl: string;
  signatureUrl: string;
  employmentStatus: string;
  employerName?: string;
  monthlyIncome: number;
  kycStatus: KYCStatus;
  riskClass: "Low" | "Medium" | "High";
  registeredAt: string;
}

export interface SavingsAccount {
  accountNumber: string;
  customerId: string;
  productType: SavingsProductType;
  balance: number;
  status: AccountStatus;
  interestRate: number; // e.g. 0.05 (5%)
  openedAt: string;
}

export interface Guarantor {
  bvn: string;
  nin: string;
  phone: string;
  address: string;
  fullName: string;
  employmentDetails: string;
  verified: boolean;
  creditScore: number;
  existingExposure: number;
  blacklistStatus: "Clean" | "Blacklisted";
  qualifies: boolean;
}

export interface Loan {
  id: string;
  customerId: string;
  productType: LoanProductType;
  principal: number;
  balance: number;
  paidAmount: number;
  interestRate: number; // e.g. 0.15 (15%)
  tenor: number; // in months
  monthlyRepayment: number;
  status: LoanStatus;
  appliedAt: string;
  disbursedAt?: string;
  riskRating: "A" | "B" | "C" | "D" | "E" | "F";
  creditScore: number;
  guarantors: Guarantor[];
  // SME Fields
  cacNumber?: string;
  rcNumber?: string;
  bnNumber?: string;
  businessName?: string;
  businessDocumentsUploaded?: boolean;
}

export interface Transaction {
  id: string;
  accountNumber?: string; // empty for general bank transactions (income, expense, bank deposit, etc.)
  loanId?: string;
  type: TransactionType;
  amount: number;
  fee: number;
  reference: string;
  date: string;
  postedBy: string; // Staff ID or "SYSTEM" or "CUSTOMER"
  status: "Completed" | "Pending" | "Reversed";
  note: string;
  isCash: boolean;
}

export interface TellerSession {
  staffId: string;
  drawerBalance: number;
  dailyLimit: number;
  vaultTransferPending: number;
  status: "Open" | "Closed";
  differenceReported: number; // if balanced cash doesn't match drawerBalance
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string; // Staff ID or Customer ID
  role: string; // StaffRole or "Customer"
  action: string;
  details: string;
  ipAddress: string;
  status: "Success" | "Failed";
}
