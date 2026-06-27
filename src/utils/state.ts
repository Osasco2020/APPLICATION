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
  TellerSession,
  KYCStatus,
  AccountStatus,
  LoanStatus,
  SavingsProductType,
  LoanProductType,
  TransactionType,
  StaffRole
} from "../types";
import {
  MOCK_CUSTOMERS,
  MOCK_ACCOUNTS,
  MOCK_LOANS,
  MOCK_TRANSACTIONS,
  MOCK_AUDIT_LOGS,
  MOCK_LEDGERS
} from "./mockData";

export interface SystemState {
  customers: Customer[];
  accounts: SavingsAccount[];
  loans: Loan[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  tellerSessions: Record<string, TellerSession>;
  ledgers: typeof MOCK_LEDGERS;
}

const STORAGE_KEY = "osarumwense_bank_state_v1";

export function loadSystemState(): SystemState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load system state", error);
  }
  return {
    customers: MOCK_CUSTOMERS,
    accounts: MOCK_ACCOUNTS,
    loans: MOCK_LOANS,
    transactions: MOCK_TRANSACTIONS,
    auditLogs: MOCK_AUDIT_LOGS,
    tellerSessions: {
      SID001: {
        staffId: "SID001",
        drawerBalance: 500000,
        dailyLimit: 2000000,
        vaultTransferPending: 0,
        status: "Open",
        differenceReported: 0
      }
    },
    ledgers: MOCK_LEDGERS
  };
}

export function saveSystemState(state: SystemState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save system state", error);
  }
}

export function createAuditLog(
  userId: string,
  role: string,
  action: string,
  details: string,
  status: "Success" | "Failed" = "Success"
): AuditLog {
  return {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    role,
    action,
    details,
    ipAddress: "192.168.1." + Math.floor(Math.random() * 100 + 2),
    status
  };
}
