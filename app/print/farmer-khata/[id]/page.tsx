"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

interface Payment {
  amount: number;
  paidOn: string;
}

interface Loan {
  id: string;
  amount: number;
  givenOn: string;
  recovered: number;
  balance: number;
  status: string;
  purpose?: string;
  payments: Payment[];
}

interface LotSettlement {
  netPayable: number;
  loanDeductions: number;
  otherDeductions: number;
  paidOn?: string;
  paymentMethod?: string;
}

interface LotSale {
  ratePerQuintal: number;
  grossAmount: number;
  commission: number;
  labourCharges: number;
  gunnyBagCharges: number;
  otherDeductions: number;
  netFarmerAmount: number;
  saleDate: string;
  trader: { name: string; firmName?: string };
}

interface Lot {
  id: string;
  lotNumber: string;
  date: string;
  cropType: string;
  variety: string;
  netWeight: number;
  noOfBags: number;
  status: string;
  sale?: LotSale;
  settlement?: LotSettlement;
}

interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
}

interface Farmer {
  id: string;
  name: string;
  nameHindi?: string;
  fatherName?: string;
  fatherNameHindi?: string;
  village?: string;
  tehsil?: string;
  mobile?: string;
  loans: Loan[];
  lots: Lot[];
  ledgerEntries: LedgerEntry[];
}

interface FarmerKhataData {
  farmer: Farmer;
  settings: Settings;
}

// ─── i18n strings ─────────────────────────────────────────────────────────────

const L = {
  en: {
    title: "Farmer Account Statement",
    titleHi: "किसान खाता",
    name: "Name",
    fatherName: "Father's Name",
    village: "Village",
    tehsil: "Tehsil",
    mobile: "Mobile",
    season: "Season",
    lotsTable: "Lot-wise Sale Details",
    sn: "S.N.",
    lotNo: "Lot No.",
    date: "Date",
    crop: "Crop",
    weight: "Wt (Qtl.)",
    bags: "Bags",
    rate: "Rate",
    gross: "Gross Amt",
    deductions: "Ded. (Comm+Lab+Misc)",
    loanDed: "Loan Ded.",
    netPaid: "Net Paid",
    status: "Status",
    total: "Total",
    loansTable: "Loan Summary",
    loanAmt: "Amount",
    recovered: "Recovered",
    balance: "Balance",
    ledger: "Ledger",
    description: "Description",
    debit: "Dr (Debit)",
    credit: "Cr (Credit)",
    runBalance: "Balance",
    arhatiyaSign: "Arhatiya's Signature",
    mktCmte: "Market Committee",
    commAgent: "(Commission Agent)",
    mobile1: "Mob:",
    shop: "Shop No.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "Print Date",
    pending: "Pending",
    sold: "Sold",
    settled: "Settled",
  },
  hi: {
    title: "Farmer Account Statement",
    titleHi: "किसान खाता",
    name: "नाम",
    fatherName: "पिता का नाम",
    village: "गाँव",
    tehsil: "तहसील",
    mobile: "मोबाइल",
    season: "सीजन",
    lotsTable: "लॉट-वार बिक्री विवरण",
    sn: "क्र.सं.",
    lotNo: "लॉट नं.",
    date: "तारीख",
    crop: "फसल",
    weight: "वजन (क्विं.)",
    bags: "बोरे",
    rate: "दर",
    gross: "सकल राशि",
    deductions: "कटौती (आढ़त+मजदूरी+अन्य)",
    loanDed: "ऋण कटौती",
    netPaid: "शुद्ध भुगतान",
    status: "स्थिति",
    total: "कुल",
    loansTable: "ऋण सारांश",
    loanAmt: "राशि",
    recovered: "वापसी",
    balance: "बकाया",
    ledger: "खाता बही",
    description: "विवरण",
    debit: "नामे (Dr)",
    credit: "जमा (Cr)",
    runBalance: "शेष",
    arhatiyaSign: "आढ़तिए के हस्ताक्षर",
    mktCmte: "मार्किट कमेटी",
    commAgent: "(कमीशन एजेन्ट)",
    mobile1: "मो:",
    shop: "दुकान नं.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "मुद्रण तिथि",
    pending: "लंबित",
    sold: "बिका",
    settled: "निपटान",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

function statusLabel(s: string, t: typeof L.hi) {
  if (s === "PENDING") return t.pending;
  if (s === "SOLD") return t.sold;
  if (s === "SETTLED") return t.settled;
  return s;
}

// ─── Shared style tokens ──────────────────────────────────────────────────────

const th: React.CSSProperties = {
  border: "1px solid #333",
  padding: "4px 6px",
  textAlign: "center",
  fontWeight: "bold",
  backgroundColor: "#f0f0f0",
  fontSize: "10px",
};

const td: React.CSSProperties = {
  border: "1px solid #333",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "10px",
};

const tdR: React.CSSProperties = { ...td, textAlign: "right" };
const tdC: React.CSSProperties = { ...td, textAlign: "center" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function FarmerKhataPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<FarmerKhataData | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("hi");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/print/farmer/${id}/khata`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading…
      </div>
    );
  }

  const { farmer, settings } = data;
  const t = L[lang];

  // Sort lots most recent first
  const sortedLots = [...farmer.lots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Totals for lots table
  let totalGross = 0;
  let totalDed = 0;
  let totalLoanDed = 0;
  let totalNet = 0;

  sortedLots.forEach((lot) => {
    if (lot.sale) {
      totalGross += lot.sale.grossAmount;
      totalDed +=
        lot.sale.commission +
        lot.sale.labourCharges +
        lot.sale.gunnyBagCharges +
        lot.sale.otherDeductions;
    }
    if (lot.settlement) {
      totalLoanDed += lot.settlement.loanDeductions;
      totalNet += lot.settlement.netPayable;
    } else if (lot.sale) {
      totalNet += lot.sale.netFarmerAmount;
    }
  });

  const today = format(new Date(), "dd/MM/yyyy");

  return (
    <>
      {/* Controls bar — hidden on print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white px-4 py-2 flex gap-3 items-center z-50 text-sm">
        <button
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="bg-white text-gray-800 px-3 py-1 rounded font-medium"
        >
          {lang === "hi" ? "English" : "हिंदी"}
        </button>
        <button
          onClick={() => window.print()}
          className="bg-green-500 text-white px-4 py-1 rounded font-medium"
        >
          Print
        </button>
        <span className="text-gray-300">
          {t.titleHi} / {t.title} — {farmer.nameHindi || farmer.name}
        </span>
      </div>

      {/* Page content */}
      <div
        className="print:pt-0 pt-12 bg-white"
        style={{ fontFamily: "'Noto Sans', 'Mangal', Arial, sans-serif" }}
      >
        <div
          className="mx-auto"
          style={{
            width: "190mm",
            padding: "4mm 0",
            fontSize: "11px",
          }}
        >
          {/* ── Letterhead ───────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "6px",
              marginBottom: "8px",
              alignItems: "start",
            }}
          >
            {/* Left */}
            <div style={{ fontSize: "10px" }}>
              <div style={{ fontWeight: "bold" }}>
                {t.mktCmte} — {settings.market_committee_name || "______"}
              </div>
              <div style={{ marginTop: "2px" }}>
                {settings.mandi_name || ""}
              </div>
              <div>
                {t.pan}: {settings.pan_number || "____________"}
              </div>
              <div>
                {t.lic}: {settings.mc_license_no || "____________"}
              </div>
            </div>

            {/* Center */}
            <div style={{ textAlign: "center", minWidth: "80mm" }}>
              <div
                style={{ fontWeight: "bold", fontSize: "18px", lineHeight: 1.2 }}
              >
                {settings.firm_name_hindi || settings.firm_name || ""}
              </div>
              <div style={{ fontSize: "10px", marginTop: "2px" }}>
                {t.commAgent}
              </div>
              <div style={{ fontSize: "10px" }}>
                {t.mobile1}{" "}
                {settings.mobile1 || ""}
                {settings.mobile2 ? `, ${settings.mobile2}` : ""}
              </div>
              <div style={{ fontSize: "10px" }}>
                {t.shop} {settings.shop_no || ""}
                {settings.address ? `, ${settings.address}` : ""}
              </div>
            </div>

            {/* Right */}
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div>
                {t.printDate}: <strong>{today}</strong>
              </div>
              <div style={{ marginTop: "4px" }}>
                {settings.current_season
                  ? `${t.season}: ${settings.current_season}`
                  : ""}
              </div>
            </div>
          </div>

          <hr style={{ borderTop: "2px solid black", marginBottom: "6px" }} />

          {/* ── Page title ───────────────────────────────────────────── */}
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            {t.titleHi} / {t.title}
          </div>

          {/* ── Farmer info box ──────────────────────────────────────── */}
          <div
            style={{
              border: "1px solid #333",
              padding: "6px 10px",
              marginBottom: "10px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 16px",
              fontSize: "11px",
            }}
          >
            <div>
              <strong>{t.name}:</strong>{" "}
              {farmer.nameHindi || farmer.name}
              {farmer.nameHindi ? ` (${farmer.name})` : ""}
            </div>
            {(farmer.fatherName || farmer.fatherNameHindi) && (
              <div>
                <strong>{t.fatherName}:</strong>{" "}
                {farmer.fatherNameHindi || farmer.fatherName}
              </div>
            )}
            <div>
              <strong>{t.village}:</strong> {farmer.village || "—"}
            </div>
            <div>
              <strong>{t.tehsil}:</strong> {farmer.tehsil || "—"}
            </div>
            <div>
              <strong>{t.mobile}:</strong> {farmer.mobile || "—"}
            </div>
            <div>
              <strong>{t.season}:</strong>{" "}
              {settings.current_season || "—"}
            </div>
          </div>

          {/* ── Lots Table ───────────────────────────────────────────── */}
          <div
            style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
          >
            {t.lotsTable}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px",
                marginBottom: "12px",
              }}
            >
              <thead>
                <tr>
                  <th style={th}>{t.sn}</th>
                  <th style={th}>{t.lotNo}</th>
                  <th style={th}>{t.date}</th>
                  <th style={th}>{t.crop}</th>
                  <th style={th}>{t.weight}</th>
                  <th style={th}>{t.bags}</th>
                  <th style={th}>{t.rate}</th>
                  <th style={th}>{t.gross}</th>
                  <th style={th}>{t.deductions}</th>
                  <th style={th}>{t.loanDed}</th>
                  <th style={th}>{t.netPaid}</th>
                  <th style={th}>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {sortedLots.map((lot, idx) => {
                  const ded = lot.sale
                    ? lot.sale.commission +
                      lot.sale.labourCharges +
                      lot.sale.gunnyBagCharges +
                      lot.sale.otherDeductions
                    : 0;
                  const loanDed = lot.settlement?.loanDeductions ?? 0;
                  const net = lot.settlement
                    ? lot.settlement.netPayable
                    : lot.sale?.netFarmerAmount ?? 0;

                  return (
                    <tr key={lot.id}>
                      <td style={tdC}>{idx + 1}</td>
                      <td style={tdC}>{lot.lotNumber}</td>
                      <td style={tdC}>{fmtDate(lot.date)}</td>
                      <td style={td}>
                        {lot.cropType}
                        {lot.variety && lot.variety !== "Other"
                          ? ` (${lot.variety})`
                          : ""}
                      </td>
                      <td style={tdR}>
                        {fmt(lot.netWeight / 100)}
                      </td>
                      <td style={tdC}>{lot.noOfBags}</td>
                      <td style={tdR}>
                        {lot.sale ? fmt(lot.sale.ratePerQuintal) : "—"}
                      </td>
                      <td style={tdR}>
                        {lot.sale ? fmt(lot.sale.grossAmount) : "—"}
                      </td>
                      <td style={tdR}>{ded > 0 ? fmt(ded) : "—"}</td>
                      <td style={tdR}>{loanDed > 0 ? fmt(loanDed) : "—"}</td>
                      <td style={{ ...tdR, fontWeight: "bold" }}>
                        {net > 0 ? fmt(net) : "—"}
                      </td>
                      <td style={tdC}>{statusLabel(lot.status, t)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td style={td} colSpan={7}>
                    {t.total}
                  </td>
                  <td style={tdR}>{fmt(totalGross)}</td>
                  <td style={tdR}>{fmt(totalDed)}</td>
                  <td style={tdR}>{fmt(totalLoanDed)}</td>
                  <td style={tdR}>{fmt(totalNet)}</td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Loans Summary Table ──────────────────────────────────── */}
          <div
            style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
          >
            {t.loansTable}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10px",
              marginBottom: "12px",
            }}
          >
            <thead>
              <tr>
                <th style={th}>{t.sn}</th>
                <th style={th}>{t.date}</th>
                <th style={th}>{t.loanAmt}</th>
                <th style={th}>{t.recovered}</th>
                <th style={th}>{t.balance}</th>
                <th style={th}>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {farmer.loans.length === 0 ? (
                <tr>
                  <td style={td} colSpan={6}>
                    <span style={{ color: "#999" }}>
                      {lang === "hi" ? "कोई ऋण नहीं" : "No loans"}
                    </span>
                  </td>
                </tr>
              ) : (
                farmer.loans.map((loan, idx) => (
                  <tr key={loan.id}>
                    <td style={tdC}>{idx + 1}</td>
                    <td style={tdC}>{fmtDate(loan.givenOn)}</td>
                    <td style={tdR}>{fmt(loan.amount)}</td>
                    <td style={tdR}>{fmt(loan.recovered)}</td>
                    <td style={{ ...tdR, fontWeight: "bold" }}>
                      {fmt(loan.balance)}
                    </td>
                    <td style={tdC}>{loan.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── Ledger Table ─────────────────────────────────────────── */}
          <div
            style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
          >
            {t.ledger}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10px",
              marginBottom: "16px",
            }}
          >
            <thead>
              <tr>
                <th style={th}>{t.date}</th>
                <th style={th}>{t.description}</th>
                <th style={th}>{t.debit}</th>
                <th style={th}>{t.credit}</th>
                <th style={th}>{t.runBalance}</th>
              </tr>
            </thead>
            <tbody>
              {farmer.ledgerEntries.length === 0 ? (
                <tr>
                  <td style={td} colSpan={5}>
                    <span style={{ color: "#999" }}>
                      {lang === "hi"
                        ? "कोई प्रविष्टि नहीं"
                        : "No entries"}
                    </span>
                  </td>
                </tr>
              ) : (
                farmer.ledgerEntries.map((entry, idx) => {
                  const isLast = idx === farmer.ledgerEntries.length - 1;
                  return (
                    <tr key={idx}>
                      <td style={tdC}>{fmtDate(entry.date)}</td>
                      <td style={td}>{entry.description}</td>
                      <td style={tdR}>
                        {entry.debit > 0 ? fmt(entry.debit) : ""}
                      </td>
                      <td style={tdR}>
                        {entry.credit > 0 ? fmt(entry.credit) : ""}
                      </td>
                      <td
                        style={{
                          ...tdR,
                          fontWeight: isLast ? "bold" : "normal",
                          fontSize: isLast ? "11px" : "10px",
                        }}
                      >
                        {fmt(Math.abs(entry.balance))}
                        {entry.balance < 0
                          ? " Dr"
                          : entry.balance > 0
                          ? " Cr"
                          : ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid black",
              paddingTop: "8px",
              marginTop: "6px",
              fontSize: "11px",
            }}
          >
            <div>{today}</div>
            <div>
              {t.arhatiyaSign}
              <br />
              <br />
              ________________________
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { margin: 0; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </>
  );
}
