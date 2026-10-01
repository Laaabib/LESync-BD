// Bangladesh Commercial Card Providers, Resort Bank Accounts, and Corporate Credit Configuration
import { PaymentMethod } from '../types/pms';

export interface BDCardProvider {
  id: string;
  name: string;
  shortName: string;
  bankType: 'Private Commercial' | 'State-Owned Commercial' | 'Foreign Commercial' | 'Islami Shariah';
  popularNetworks: ('Visa' | 'Mastercard' | 'Amex' | 'Nexus' | 'UnionPay' | 'JCB')[];
  posTerminal: string;
}

export interface ResortBankAccount {
  id: string;
  bankName: string;
  shortName: string;
  branchName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'Current Deposit (CD)' | 'Corporate Escrow' | 'Al-Wadeeah Current';
  glAccountCode: string; // Typically 1010
  glAccountName: string;
  currency: 'BDT';
}

export const BD_CARD_PROVIDERS: BDCardProvider[] = [
  {
    id: 'city-bank',
    name: 'The City Bank Limited (AMEX / Visa / Mastercard / UnionPay)',
    shortName: 'City Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Amex', 'Visa', 'Mastercard', 'UnionPay'],
    posTerminal: 'City Bank Merchant POS #01'
  },
  {
    id: 'dbbl',
    name: 'Dutch-Bangla Bank Limited (DBBL Nexus / Visa / Mastercard)',
    shortName: 'DBBL (Nexus)',
    bankType: 'Private Commercial',
    popularNetworks: ['Nexus', 'Visa', 'Mastercard'],
    posTerminal: 'DBBL NexusPay POS #01'
  },
  {
    id: 'brac-bank',
    name: 'BRAC Bank PLC (Visa / Mastercard)',
    shortName: 'BRAC Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'BRAC Bank POS Terminal #02'
  },
  {
    id: 'ebl',
    name: 'Eastern Bank PLC (EBL Visa / Mastercard / UnionPay / Diners)',
    shortName: 'Eastern Bank (EBL)',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard', 'UnionPay'],
    posTerminal: 'EBL Merchant POS #03'
  },
  {
    id: 'scb',
    name: 'Standard Chartered Bank Bangladesh (SCB Visa / Mastercard)',
    shortName: 'Standard Chartered',
    bankType: 'Foreign Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'SCB Global POS #01'
  },
  {
    id: 'sonali-bank',
    name: 'Sonali Bank PLC (Q-Cash / Visa)',
    shortName: 'Sonali Bank',
    bankType: 'State-Owned Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'Sonali Bank Smart POS'
  },
  {
    id: 'ibbl',
    name: 'Islami Bank Bangladesh Limited (Khidmah Card / Visa)',
    shortName: 'Islami Bank (IBBL)',
    bankType: 'Islami Shariah',
    popularNetworks: ['Visa'],
    posTerminal: 'IBBL Shariah POS #01'
  },
  {
    id: 'mtb',
    name: 'Mutual Trust Bank PLC (MTB Visa / Mastercard)',
    shortName: 'MTB',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'MTB POS Terminal #01'
  },
  {
    id: 'prime-bank',
    name: 'Prime Bank Limited (Visa / Mastercard)',
    shortName: 'Prime Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Prime Bank POS #01'
  },
  {
    id: 'ucb',
    name: 'United Commercial Bank PLC (UCB Visa / Mastercard)',
    shortName: 'UCB',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'UCB POS Terminal #01'
  },
  {
    id: 'dhaka-bank',
    name: 'Dhaka Bank Limited (Visa / Mastercard)',
    shortName: 'Dhaka Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Dhaka Bank POS'
  },
  {
    id: 'premier-bank',
    name: 'The Premier Bank Limited (Visa / Mastercard)',
    shortName: 'Premier Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Premier Bank POS'
  },
  {
    id: 'bank-asia',
    name: 'Bank Asia Limited (Visa / Mastercard)',
    shortName: 'Bank Asia',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Bank Asia POS'
  },
  {
    id: 'southeast-bank',
    name: 'Southeast Bank Limited (Visa / Mastercard)',
    shortName: 'Southeast Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'SEBL POS'
  },
  {
    id: 'national-bank',
    name: 'National Bank Limited (NBL Visa / Mastercard)',
    shortName: 'National Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'NBL POS'
  },
  {
    id: 'pubali-bank',
    name: 'Pubali Bank Limited (Visa / Mastercard)',
    shortName: 'Pubali Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Pubali Bank POS'
  },
  {
    id: 'jamuna-bank',
    name: 'Jamuna Bank Limited (Visa / Mastercard)',
    shortName: 'Jamuna Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Jamuna Bank POS'
  },
  {
    id: 'trust-bank',
    name: 'Trust Bank Limited (Visa / Mastercard)',
    shortName: 'Trust Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Trust Bank POS'
  },
  {
    id: 'ncc-bank',
    name: 'NCC Bank Limited (Visa / Mastercard)',
    shortName: 'NCC Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'NCC Bank POS'
  },
  {
    id: 'community-bank',
    name: 'Community Bank Bangladesh PLC (Visa)',
    shortName: 'Community Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'Community Bank POS'
  },
  {
    id: 'midland-bank',
    name: 'Midland Bank Limited (Visa / Mastercard)',
    shortName: 'Midland Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Midland Bank POS'
  },
  {
    id: 'meghna-bank',
    name: 'Meghna Bank Limited (Visa)',
    shortName: 'Meghna Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'Meghna Bank POS'
  },
  {
    id: 'sbac-bank',
    name: 'SBAC Bank Limited (Visa)',
    shortName: 'SBAC Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'SBAC Bank POS'
  },
  {
    id: 'shimanto-bank',
    name: 'Shimanto Bank Limited (Visa)',
    shortName: 'Shimanto Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'Shimanto Bank POS'
  },
  {
    id: 'al-arafah',
    name: 'Al-Arafah Islami Bank PLC (Mastercard / FastPay)',
    shortName: 'Al-Arafah Islami',
    bankType: 'Islami Shariah',
    popularNetworks: ['Mastercard'],
    posTerminal: 'AIBL Shariah POS'
  },
  {
    id: 'social-islami',
    name: 'Social Islami Bank PLC (SIBL Visa)',
    shortName: 'Social Islami (SIBL)',
    bankType: 'Islami Shariah',
    popularNetworks: ['Visa'],
    posTerminal: 'SIBL POS'
  },
  {
    id: 'exim-bank',
    name: 'EXIM Bank Bangladesh PLC (Visa / Mastercard)',
    shortName: 'EXIM Bank',
    bankType: 'Islami Shariah',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'EXIM Bank POS'
  },
  {
    id: 'shahjalal-islami',
    name: 'Shahjalal Islami Bank PLC (Visa)',
    shortName: 'Shahjalal Islami',
    bankType: 'Islami Shariah',
    popularNetworks: ['Visa'],
    posTerminal: 'SJIBL POS'
  },
  {
    id: 'hsbc-bd',
    name: 'HSBC Bangladesh (Visa)',
    shortName: 'HSBC Bangladesh',
    bankType: 'Foreign Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'HSBC Global Terminal'
  },
  {
    id: 'mercantile-bank',
    name: 'Mercantile Bank PLC (Visa / Mastercard)',
    shortName: 'Mercantile Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa', 'Mastercard'],
    posTerminal: 'Mercantile Bank POS'
  },
  {
    id: 'nrbc-bank',
    name: 'NRBC Bank PLC (Visa / Planet)',
    shortName: 'NRBC Bank',
    bankType: 'Private Commercial',
    popularNetworks: ['Visa'],
    posTerminal: 'NRBC Bank POS'
  },
  {
    id: 'global-islami',
    name: 'Global Islami Bank PLC (Visa)',
    shortName: 'Global Islami',
    bankType: 'Islami Shariah',
    popularNetworks: ['Visa'],
    posTerminal: 'GIBL POS'
  }
];

export const CARD_NETWORKS = [
  { id: 'Visa', label: 'Visa Card', color: 'text-blue-400' },
  { id: 'Mastercard', label: 'Mastercard', color: 'text-orange-400' },
  { id: 'Amex', label: 'American Express (City Bank AMEX)', color: 'text-sky-400' },
  { id: 'Nexus', label: 'DBBL Nexus (Domestic Debit)', color: 'text-emerald-400' },
  { id: 'UnionPay', label: 'UnionPay International', color: 'text-rose-400' },
  { id: 'JCB', label: 'JCB International', color: 'text-indigo-400' }
] as const;

export const RESORT_BANK_ACCOUNTS: ResortBankAccount[] = [
  {
    id: 'bank-sonali',
    bankName: 'Sonali Bank PLC',
    shortName: 'Sonali Bank Corporate',
    branchName: 'Principal Branch, Motijheel, Dhaka',
    accountNumber: '0102-392019283',
    routingNumber: '200271829',
    accountType: 'Current Deposit (CD)',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  },
  {
    id: 'bank-dbbl',
    bankName: 'Dutch-Bangla Bank Limited (DBBL)',
    shortName: 'DBBL Corporate CD',
    branchName: 'Gulshan Branch, Dhaka',
    accountNumber: '115-110-4829103',
    routingNumber: '090261942',
    accountType: 'Current Deposit (CD)',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  },
  {
    id: 'bank-ebl',
    bankName: 'Eastern Bank PLC (EBL)',
    shortName: 'EBL Resort Operations A/C',
    branchName: 'Principal Branch, Dilkusha, Dhaka',
    accountNumber: '104-106-7829102',
    routingNumber: '095272911',
    accountType: 'Corporate Escrow',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  },
  {
    id: 'bank-city',
    bankName: 'The City Bank Limited',
    shortName: 'City Bank Resort CD A/C',
    branchName: 'Gulshan Avenue Branch, Dhaka',
    accountNumber: '310-291-0948271',
    routingNumber: '225261893',
    accountType: 'Current Deposit (CD)',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  },
  {
    id: 'bank-brac',
    bankName: 'BRAC Bank PLC',
    shortName: 'BRAC Bank Corporate A/C',
    branchName: 'Banani Branch, Dhaka',
    accountNumber: '150-120-9482019',
    routingNumber: '060261771',
    accountType: 'Current Deposit (CD)',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  },
  {
    id: 'bank-ibbl',
    bankName: 'Islami Bank Bangladesh Limited (IBBL)',
    shortName: 'IBBL Shariah AWCA',
    branchName: 'Foreign Exchange / Motijheel Branch',
    accountNumber: '205-010-9837190',
    routingNumber: '125271920',
    accountType: 'Al-Wadeeah Current',
    glAccountCode: '1010',
    glAccountName: 'Cash in Vault & Commercial Bank Accounts',
    currency: 'BDT'
  }
];

export const SIMPLE_CARD_OPTIONS = [
  { id: 'visa-mastercard', label: 'Visa / MasterCard', terminal: 'Commercial Bank POS #01' },
  { id: 'city-amex', label: 'American Express (City Bank POS)', terminal: 'City Bank Merchant POS #01' },
  { id: 'dbbl-nexus', label: 'DBBL Nexus / NexusPay', terminal: 'DBBL NexusPay POS #01' },
  { id: 'brac-card', label: 'BRAC Bank POS', terminal: 'BRAC Bank POS Terminal #02' },
  { id: 'ebl-card', label: 'Eastern Bank (EBL) POS', terminal: 'EBL Merchant POS #03' },
  { id: 'unionpay', label: 'UnionPay / JCB Card', terminal: 'UnionPay POS Terminal' },
  { id: 'other-card', label: 'Other Bank POS Machine', terminal: 'Counter POS Terminal' }
];

export interface PaymentTenderDetails {
  // Common
  method: PaymentMethod;
  amount: number;
  reference: string;
  notes?: string;

  // Card Payment Specifics (Clean & Simple Dropdown)
  cardType?: string;
  cardProviderId?: string;
  cardProviderName?: string;
  cardNetwork?: string;
  cardLast4?: string;
  cardApprovalCode?: string;
  posTerminal?: string;

  // Bank Transfer Specifics (Just Transaction No & Trace No)
  transactionNo?: string;
  traceNo?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  senderBankName?: string;
  bankTxnRef?: string;
  transferDate?: string;

  // Company Credit (City Ledger) Specifics
  cityLedgerAccountId?: string;
  cityLedgerAccountName?: string;
  companyPoNumber?: string;
  authorizedBy?: string;
}
