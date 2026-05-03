// Charge calculation utilities for Haryana APMC

export interface ChargeInput {
  netWeight: number;
  ratePerQuintal: number;
  commissionRate?: number;
  marketFeeRate?: number;
  rdfRate?: number;
  labourCharges?: number;
  gunnyBagCharges?: number;
  otherDeductions?: number;
}

export interface ChargeResult {
  grossAmount: number;
  marketFee: number;
  rdf: number;
  commission: number;
  labourCharges: number;
  gunnyBagCharges: number;
  otherDeductions: number;
  netFarmerAmount: number;
  buyerTotalAmount: number;
  farmerDeductions: number;
}

export function calculateCharges(input: ChargeInput): ChargeResult {
  const {
    netWeight,
    ratePerQuintal,
    commissionRate = 2.5,
    marketFeeRate = 2,
    rdfRate = 2,
    labourCharges = 0,
    gunnyBagCharges = 0,
    otherDeductions = 0,
  } = input;

  const netWeightQtl = netWeight / 100; // convert kg → quintals
  const grossAmount = round2(netWeightQtl * ratePerQuintal);
  const marketFee = round2(grossAmount * (marketFeeRate / 100));
  const rdf = round2(grossAmount * (rdfRate / 100));
  const commission = round2(grossAmount * (commissionRate / 100));
  const farmerDeductions = round2(commission + labourCharges + gunnyBagCharges + otherDeductions);
  const netFarmerAmount = round2(grossAmount - farmerDeductions);
  const buyerTotalAmount = round2(grossAmount + marketFee + rdf);

  return {
    grossAmount,
    marketFee,
    rdf,
    commission,
    labourCharges,
    gunnyBagCharges,
    otherDeductions,
    netFarmerAmount,
    buyerTotalAmount,
    farmerDeductions,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function generateLotNumber(prefix: string = "KNL", date?: Date): string {
  const d = date ?? new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}/${yy}${mm}${dd}/${rand}`;
}

export const CROP_OPTIONS = [
  { value: "wheat", label: "Wheat (Gehun)", labelHi: "गेहूं" },
  { value: "paddy_pr14", label: "Paddy PR-14", labelHi: "धान PR-14" },
  { value: "paddy_pr26", label: "Paddy PR-26", labelHi: "धान PR-26" },
  { value: "basmati_1121", label: "Basmati 1121", labelHi: "बासमती 1121" },
  { value: "basmati_1509", label: "Basmati 1509", labelHi: "बासमती 1509" },
  { value: "mustard", label: "Mustard (Sarson)", labelHi: "सरसों" },
  { value: "gram", label: "Gram (Chana)", labelHi: "चना" },
  { value: "maize", label: "Maize (Makka)", labelHi: "मक्का" },
  { value: "other", label: "Other", labelHi: "अन्य" },
];

export const QUALITY_GRADES = ["FAQ", "Below FAQ", "Grade A", "Grade B"];
export const BAG_TYPES = ["Gunny", "Plastic", "Jute"];
export const PAYMENT_METHODS = ["Cash", "NEFT", "RTGS", "Cheque", "UPI"];
export const ARHATIYA_MODES = [
  { value: "KUTCHA", label: "Kutcha (Agent/Broker)" },
  { value: "PUCCA", label: "Pucca (Own Account)" },
];
