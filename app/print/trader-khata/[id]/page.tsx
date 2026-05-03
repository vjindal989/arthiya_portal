"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

interface LotRef {
  lotNumber: string;
  date: string;
  cropType: string;
  variety: string;
  netWeight: number;
  noOfBags: number;
  farmer: { name: string };
}

interface Purchase {
  id: string;
  ratePerQuintal: number;
  grossAmount: number;
  marketFee: number;
  rdf: number;
  commission: number;
  labourCharges: number;
  gunnyBagCharges: number;
  otherDeductions: number;
  buyerTotalAmount: number;
  buyerPaid: number;
  buyerPaidDate?: string | null;
  saleDate: string;
  lot: LotRef;
}

interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface Trader {
  id: string;
  name: string;
  firmName?: string;
  mobile?: string;
  licenseNo?: string;
  address?: string;
  purchases: Purchase[];
  ledgerEntries: LedgerEntry[];
}

interface TraderKhataData {
  trader: Trader;
  settings: Settings;
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

const L = {
  en: {
    title: "Trader Account Statement",
    titleHi: "व्यापारी खाता",
    name: "Name",
    firm: "Firm",
    mobile: "Mobile",
    licenseNo: "License No.",
    address: "Address",
    purchasesTable: "Purchase Details",
    sn: "S.N.",
    date: "Date",
    lotNo: "Lot No.",
    farmer: "Farmer",
    crop: "Crop",
    weight: "Wt (Qtl.)",
    rate: "Rate",
    gross: "Gross Amt",
    marketFee: "Market Charge",
    totalPayable: "Total Payable",
    payStatus: "Payment Status",
    total: "Total",
    ledger: "Ledger",
    description: "Description",
    debit: "Dr (Debit)",
    credit: "Cr (Credit)",
    runBalance: "Balance",
    arhatiyaSign: "Arhatiya's Signature",
    traderSign: "Trader's Signature",
    mktCmte: "Market Committee",
    commAgent: "(Commission Agent)",
    mob: "Mob:",
    shop: "Shop No.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "Print Date",
    paid: "Paid",
    unpaid: "Unpaid",
    partial: "Partial",
  },
  hi: {
    title: "Trader Account Statement",
    titleHi: "व्यापारी खाता",
    name: "नाम",
    firm: "फर्म",
    mobile: "मोबाइल",
    licenseNo: "लाइसेंस नं.",
    address: "पता",
    purchasesTable: "खरीद विवरण",
    sn: "क्र.सं.",
    date: "तारीख",
    lotNo: "लॉट नं.",
    farmer: "किसान",
    crop: "फसल",
    weight: "वजन (क्विं.)",
    rate: "दर",
    gross: "सकल राशि",
    marketFee: "मार्किट प्रभार",
    totalPayable: "कुल देय",
    payStatus: "भुगतान स्थिति",
    total: "कुल",
    ledger: "खाता बही",
    description: "विवरण",
    debit: "नामे (Dr)",
    credit: "जमा (Cr)",
    runBalance: "शेष",
    arhatiyaSign: "आढ़तिए के हस्ताक्षर",
    traderSign: "व्यापारी के हस्ताक्षर",
    mktCmte: "मार्किट कमेटी",
    commAgent: "(कमीशन एजेन्ट)",
    mob: "मो:",
    shop: "दुकान नं.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "मुद्रण तिथि",
    paid: "भुगतान हो गया",
    unpaid: "बकाया",
    partial: "आंशिक",
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

function paymentStatus(p: Purchase, t: typeof L.hi) {
  if (p.buyerPaid <= 0) return t.unpaid;
  if (p.buyerPaid >= p.buyerTotalAmount) return t.paid;
  return t.partial;
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

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

export default function TraderKhataPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TraderKhataData | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("hi");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/print/trader/${id}/khata`)
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

  const { trader, settings } = data;
  const t = L[lang];

  // Sort purchases most recent first
  const sortedPurchases = [...trader.purchases].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );

  // Totals
  let totalGross = 0;
  let totalMarketFee = 0;
  let totalPayable = 0;
  let totalPaid = 0;

  sortedPurchases.forEach((p) => {
    totalGross += p.grossAmount;
    totalMarketFee += p.marketFee + p.rdf;
    totalPayable += p.buyerTotalAmount;
    totalPaid += p.buyerPaid;
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
          {t.titleHi} / {t.title} —{" "}
          {trader.firmName || trader.name}
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
                {t.mob}{" "}
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

          {/* ── Trader info box ──────────────────────────────────────── */}
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
              <strong>{t.name}:</strong> {trader.name}
            </div>
            <div>
              <strong>{t.firm}:</strong> {trader.firmName || "—"}
            </div>
            <div>
              <strong>{t.mobile}:</strong> {trader.mobile || "—"}
            </div>
            <div>
              <strong>{t.licenseNo}:</strong> {trader.licenseNo || "—"}
            </div>
            {trader.address && (
              <div style={{ gridColumn: "1 / -1" }}>
                <strong>{t.address}:</strong> {trader.address}
              </div>
            )}
          </div>

          {/* ── Purchases Table ──────────────────────────────────────── */}
          <div
            style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
          >
            {t.purchasesTable}
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
                  <th style={th}>{t.date}</th>
                  <th style={th}>{t.lotNo}</th>
                  <th style={th}>{t.farmer}</th>
                  <th style={th}>{t.crop}</th>
                  <th style={th}>{t.weight}</th>
                  <th style={th}>{t.rate}</th>
                  <th style={th}>{t.gross}</th>
                  <th style={th}>{t.marketFee}</th>
                  <th style={th}>{t.totalPayable}</th>
                  <th style={th}>{t.payStatus}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPurchases.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={11}>
                      <span style={{ color: "#999" }}>
                        {lang === "hi" ? "कोई खरीद नहीं" : "No purchases"}
                      </span>
                    </td>
                  </tr>
                ) : (
                  sortedPurchases.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={tdC}>{idx + 1}</td>
                      <td style={tdC}>{fmtDate(p.saleDate)}</td>
                      <td style={tdC}>{p.lot.lotNumber}</td>
                      <td style={td}>{p.lot.farmer.name}</td>
                      <td style={td}>
                        {p.lot.cropType}
                        {p.lot.variety && p.lot.variety !== "Other"
                          ? ` (${p.lot.variety})`
                          : ""}
                      </td>
                      <td style={tdR}>{fmt(p.lot.netWeight / 100)}</td>
                      <td style={tdR}>{fmt(p.ratePerQuintal)}</td>
                      <td style={tdR}>{fmt(p.grossAmount)}</td>
                      <td style={tdR}>{fmt(p.marketFee + p.rdf)}</td>
                      <td style={{ ...tdR, fontWeight: "bold" }}>
                        {fmt(p.buyerTotalAmount)}
                      </td>
                      <td style={tdC}>{paymentStatus(p, t)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td style={td} colSpan={7}>
                    {t.total}
                  </td>
                  <td style={tdR}>{fmt(totalGross)}</td>
                  <td style={tdR}>{fmt(totalMarketFee)}</td>
                  <td style={tdR}>{fmt(totalPayable)}</td>
                  <td style={td}></td>
                </tr>
                <tr style={{ backgroundColor: "#fff8e1" }}>
                  <td style={td} colSpan={9}>
                    {lang === "hi" ? "कुल भुगतान प्राप्त:" : "Total Received:"}
                  </td>
                  <td style={{ ...tdR, fontWeight: "bold" }}>
                    {fmt(totalPaid)}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr style={{ backgroundColor: "#ffeaea" }}>
                  <td style={td} colSpan={9}>
                    {lang === "hi" ? "कुल बकाया:" : "Total Outstanding:"}
                  </td>
                  <td
                    style={{
                      ...tdR,
                      fontWeight: "bold",
                      color: totalPayable - totalPaid > 0 ? "#c00" : "inherit",
                    }}
                  >
                    {fmt(totalPayable - totalPaid)}
                  </td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>

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
              {trader.ledgerEntries.length === 0 ? (
                <tr>
                  <td style={td} colSpan={5}>
                    <span style={{ color: "#999" }}>
                      {lang === "hi" ? "कोई प्रविष्टि नहीं" : "No entries"}
                    </span>
                  </td>
                </tr>
              ) : (
                trader.ledgerEntries.map((entry, idx) => {
                  const isLast = idx === trader.ledgerEntries.length - 1;
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
            <div>
              {t.traderSign}
              <br />
              <br />
              ________________________
            </div>
            <div style={{ textAlign: "right" }}>
              {t.arhatiyaSign}
              <br />
              <br />
              ________________________
              <br />
              <span style={{ fontSize: "10px" }}>{today}</span>
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
