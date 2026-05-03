"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

interface LotSale {
  ratePerQuintal: number;
  grossAmount: number;
  commission: number;
  marketFee: number;
  rdf: number;
  labourCharges: number;
  gunnyBagCharges: number;
  otherDeductions: number;
  netFarmerAmount: number;
  buyerTotalAmount: number;
  saleDate: string;
  trader: { name: string; firmName?: string };
}

interface LotSettlement {
  netPayable: number;
  loanDeductions: number;
  paidOn?: string;
  paymentMethod?: string;
}

interface RojnamchaLot {
  id: string;
  lotNumber: string;
  date: string;
  cropType: string;
  variety: string;
  netWeight: number;
  noOfBags: number;
  status: string;
  arhatiyaMode?: string;
  farmer: { name: string };
  sale?: LotSale;
  settlement?: LotSettlement;
}

interface RojnamchaData {
  date: string;
  lots: RojnamchaLot[];
  settings: Settings;
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

const L = {
  en: {
    title: "Day Book",
    titleHi: "रोजनामचा",
    dateLabel: "Date",
    sn: "S.N.",
    lotNo: "Lot No.",
    farmer: "Farmer",
    buyer: "Buyer",
    crop: "Crop",
    weight: "Wt (Qtl.)",
    bags: "Bags",
    rate: "Rate",
    gross: "Gross Amt",
    commission: "Comm.",
    marketTax: "Mkt Tax",
    rdf: "RDF/Cess",
    labMisc: "Lab/Misc",
    netFarmer: "Net Farmer",
    buyerTotal: "Buyer Total",
    status: "Status",
    total: "Total",
    summaryTitle: "Summary",
    totalLots: "Total Lots",
    pending: "Pending",
    sold: "Sold",
    settled: "Settled",
    totalGross: "Total Gross Amount",
    totalComm: "Total Commission Earned",
    totalMktFee: "Total Market Fee",
    totalSettled: "Total Settled to Farmers",
    arhatiyaSign: "Arhatiya's Signature",
    mktCmte: "Market Committee",
    commAgent: "(Commission Agent)",
    mob: "Mob:",
    shop: "Shop No.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "Print Date",
    noData: "No lots found for this date.",
  },
  hi: {
    title: "Day Book",
    titleHi: "रोजनामचा",
    dateLabel: "तारीख",
    sn: "क्र.सं.",
    lotNo: "लॉट नं.",
    farmer: "किसान",
    buyer: "खरीददार",
    crop: "फसल",
    weight: "वजन (क्विं.)",
    bags: "बोरे",
    rate: "दर",
    gross: "सकल राशि",
    commission: "आढ़त",
    marketTax: "मार्किट टैक्स",
    rdf: "उपकर",
    labMisc: "मजदूरी/अन्य",
    netFarmer: "शुद्ध किसान राशि",
    buyerTotal: "खरीददार कुल",
    status: "स्थिति",
    total: "कुल",
    summaryTitle: "सारांश",
    totalLots: "कुल लॉट",
    pending: "लंबित",
    sold: "बिका",
    settled: "निपटान",
    totalGross: "कुल सकल राशि",
    totalComm: "कुल आढ़त",
    totalMktFee: "कुल मार्किट शुल्क",
    totalSettled: "किसानों को कुल भुगतान",
    arhatiyaSign: "आढ़तिए के हस्ताक्षर",
    mktCmte: "मार्किट कमेटी",
    commAgent: "(कमीशन एजेन्ट)",
    mob: "मो:",
    shop: "दुकान नं.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "मुद्रण तिथि",
    noData: "इस तारीख के लिए कोई लॉट नहीं मिला।",
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

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

function statusLabel(s: string, t: typeof L.hi) {
  if (s === "PENDING") return t.pending;
  if (s === "SOLD") return t.sold;
  if (s === "SETTLED") return t.settled;
  return s;
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

export default function RojnamchaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [data, setData] = useState<RojnamchaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("hi");

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/print/rojnamcha?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [selectedDate]);

  const t = L[lang];
  const today = format(new Date(), "dd/MM/yyyy");

  const lots = data?.lots ?? [];
  const settings = data?.settings ?? {};

  // Totals
  let totalGross = 0;
  let totalComm = 0;
  let totalMktFee = 0;
  let totalSettled = 0;
  let countPending = 0;
  let countSold = 0;
  let countSettled = 0;

  lots.forEach((lot) => {
    if (lot.status === "PENDING") countPending++;
    else if (lot.status === "SOLD") countSold++;
    else if (lot.status === "SETTLED") countSettled++;

    if (lot.sale) {
      totalGross += lot.sale.grossAmount;
      totalComm += lot.sale.commission;
      totalMktFee += lot.sale.marketFee + lot.sale.rdf;
    }
    if (lot.settlement) {
      totalSettled += lot.settlement.netPayable;
    } else if (lot.sale) {
      totalSettled += lot.sale.netFarmerAmount;
    }
  });

  return (
    <>
      {/* Controls bar — hidden on print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white px-4 py-2 flex gap-3 items-center z-50 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-300">{t.dateLabel}:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-500"
          />
        </label>
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
          {t.titleHi} — {fmtDate(selectedDate)}
        </span>
        {loading && (
          <span className="text-yellow-300 text-xs ml-2">Loading…</span>
        )}
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
            {t.titleHi} — {fmtDate(selectedDate)} / {t.title}
          </div>

          {/* ── Main Transactions Table ──────────────────────────────── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
              Loading…
            </div>
          ) : lots.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              {t.noData}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                  marginBottom: "14px",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>{t.sn}</th>
                    <th style={th}>{t.lotNo}</th>
                    <th style={th}>{t.farmer}</th>
                    <th style={th}>{t.buyer}</th>
                    <th style={th}>{t.crop}</th>
                    <th style={th}>{t.weight}</th>
                    <th style={th}>{t.bags}</th>
                    <th style={th}>{t.rate}</th>
                    <th style={th}>{t.gross}</th>
                    <th style={th}>{t.commission}</th>
                    <th style={th}>{t.marketTax}</th>
                    <th style={th}>{t.rdf}</th>
                    <th style={th}>{t.labMisc}</th>
                    <th style={th}>{t.netFarmer}</th>
                    <th style={th}>{t.buyerTotal}</th>
                    <th style={th}>{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot, idx) => {
                    const labMisc = lot.sale
                      ? lot.sale.labourCharges +
                        lot.sale.gunnyBagCharges +
                        lot.sale.otherDeductions
                      : 0;
                    return (
                      <tr key={lot.id}>
                        <td style={tdC}>{idx + 1}</td>
                        <td style={tdC}>{lot.lotNumber}</td>
                        <td style={td}>{lot.farmer.name}</td>
                        <td style={td}>
                          {lot.sale
                            ? lot.sale.trader.firmName || lot.sale.trader.name
                            : "—"}
                        </td>
                        <td style={td}>
                          {lot.cropType}
                          {lot.variety && lot.variety !== "Other"
                            ? ` (${lot.variety})`
                            : ""}
                        </td>
                        <td style={tdR}>{fmt(lot.netWeight / 100)}</td>
                        <td style={tdC}>{lot.noOfBags}</td>
                        <td style={tdR}>
                          {lot.sale ? fmt(lot.sale.ratePerQuintal) : "—"}
                        </td>
                        <td style={tdR}>
                          {lot.sale ? fmt(lot.sale.grossAmount) : "—"}
                        </td>
                        <td style={tdR}>
                          {lot.sale && lot.sale.commission > 0
                            ? fmt(lot.sale.commission)
                            : "—"}
                        </td>
                        <td style={tdR}>
                          {lot.sale && lot.sale.marketFee > 0
                            ? fmt(lot.sale.marketFee)
                            : "—"}
                        </td>
                        <td style={tdR}>
                          {lot.sale && lot.sale.rdf > 0
                            ? fmt(lot.sale.rdf)
                            : "—"}
                        </td>
                        <td style={tdR}>
                          {labMisc > 0 ? fmt(labMisc) : "—"}
                        </td>
                        <td style={{ ...tdR, fontWeight: "bold" }}>
                          {lot.sale ? fmt(lot.sale.netFarmerAmount) : "—"}
                        </td>
                        <td style={tdR}>
                          {lot.sale ? fmt(lot.sale.buyerTotalAmount) : "—"}
                        </td>
                        <td style={tdC}>{statusLabel(lot.status, t)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                    <td style={td} colSpan={8}>
                      {t.total}
                    </td>
                    <td style={tdR}>{fmt(totalGross)}</td>
                    <td style={tdR}>{fmt(totalComm)}</td>
                    <td style={tdR} colSpan={2}>
                      {fmt(totalMktFee)}
                    </td>
                    <td style={td}></td>
                    <td style={tdR}>{fmt(totalSettled)}</td>
                    <td style={td}></td>
                    <td style={td}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Summary Box ──────────────────────────────────────────── */}
          {!loading && lots.length > 0 && (
            <div
              style={{
                border: "1px solid #333",
                padding: "8px 12px",
                marginBottom: "14px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginBottom: "6px",
                  borderBottom: "1px solid #ccc",
                  paddingBottom: "4px",
                }}
              >
                {t.summaryTitle}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 20px",
                  fontSize: "11px",
                }}
              >
                <div>
                  <strong>{t.totalLots}:</strong> {lots.length} (
                  {t.pending}: {countPending}, {t.sold}: {countSold},{" "}
                  {t.settled}: {countSettled})
                </div>
                <div>
                  <strong>{t.totalGross}:</strong> ₹{fmt(totalGross)}
                </div>
                <div>
                  <strong>{t.totalComm}:</strong> ₹{fmt(totalComm)}
                </div>
                <div>
                  <strong>{t.totalMktFee}:</strong> ₹{fmt(totalMktFee)}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>{t.totalSettled}:</strong> ₹{fmt(totalSettled)}
                </div>
              </div>
            </div>
          )}

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
            <div>{fmtDate(selectedDate)}</div>
            <div style={{ textAlign: "right" }}>
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
