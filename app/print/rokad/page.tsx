"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

interface CashEntry {
  date: string;
  type: "receipt" | "payment";
  description: string;
  amount: number;
  party: string;
  method?: string | null;
}

interface RokadData {
  from: string;
  to: string;
  entries: CashEntry[];
  settings: Settings;
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

const L = {
  en: {
    title: "Cash Book",
    titleHi: "रोकड़",
    from: "From",
    to: "To",
    dateLabel: "Date",
    description: "Description",
    party: "Party",
    method: "Method",
    receipt: "Receipt (Cr)",
    payment: "Payment (Dr)",
    balance: "Balance",
    total: "Total",
    summaryTitle: "Summary",
    totalReceipts: "Total Receipts",
    totalPayments: "Total Payments",
    netBalance: "Net Balance",
    arhatiyaSign: "Arhatiya's Signature",
    mktCmte: "Market Committee",
    commAgent: "(Commission Agent)",
    mob: "Mob:",
    shop: "Shop No.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "Print Date",
    noData: "No entries found for this date range.",
    openingBalance: "Opening Balance",
    closingBalance: "Closing Balance",
  },
  hi: {
    title: "Cash Book",
    titleHi: "रोकड़",
    from: "से",
    to: "तक",
    dateLabel: "तारीख",
    description: "विवरण",
    party: "पार्टी",
    method: "भुगतान विधि",
    receipt: "रसीद (जमा)",
    payment: "भुगतान (नामे)",
    balance: "शेष",
    total: "कुल",
    summaryTitle: "सारांश",
    totalReceipts: "कुल रसीद",
    totalPayments: "कुल भुगतान",
    netBalance: "शुद्ध शेष",
    arhatiyaSign: "आढ़तिए के हस्ताक्षर",
    mktCmte: "मार्किट कमेटी",
    commAgent: "(कमीशन एजेन्ट)",
    mob: "मो:",
    shop: "दुकान नं.",
    pan: "PAN",
    lic: "M.C. Lic No.",
    printDate: "मुद्रण तिथि",
    noData: "इस अवधि के लिए कोई प्रविष्टि नहीं मिली।",
    openingBalance: "प्रारंभिक शेष",
    closingBalance: "अंतिम शेष",
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

export default function RokadPage() {
  const [fromDate, setFromDate] = useState<string>(todayIso());
  const [toDate, setToDate] = useState<string>(todayIso());
  const [data, setData] = useState<RokadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("hi");

  useEffect(() => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    fetch(`/api/print/rokad?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [fromDate, toDate]);

  const t = L[lang];
  const today = format(new Date(), "dd/MM/yyyy");

  const entries = data?.entries ?? [];
  const settings = data?.settings ?? {};

  // Compute running balance and totals
  let runBalance = 0;
  let totalReceipts = 0;
  let totalPayments = 0;

  interface EnrichedEntry extends CashEntry {
    runningBalance: number;
  }

  const enriched: EnrichedEntry[] = entries.map((e) => {
    if (e.type === "receipt") {
      runBalance += e.amount;
      totalReceipts += e.amount;
    } else {
      runBalance -= e.amount;
      totalPayments += e.amount;
    }
    return { ...e, runningBalance: runBalance };
  });

  const netBalance = totalReceipts - totalPayments;

  const dateRangeLabel =
    fromDate === toDate
      ? fmtDate(fromDate)
      : `${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

  return (
    <>
      {/* Controls bar — hidden on print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white px-4 py-2 flex gap-3 items-center z-50 text-sm flex-wrap">
        <label className="flex items-center gap-2">
          <span className="text-gray-300">{t.from}:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-500"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-300">{t.to}:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
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
          {t.titleHi} / {t.title} — {dateRangeLabel}
        </span>
        {loading && (
          <span className="text-yellow-300 text-xs ml-2">Loading…</span>
        )}
      </div>

      {/* Page content */}
      <div
        className="print:pt-0 pt-14 bg-white"
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
              <div style={{ marginTop: "4px" }}>
                {t.from}: {fmtDate(fromDate)}
              </div>
              <div>
                {t.to}: {fmtDate(toDate)}
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
            {t.titleHi} / {t.title} — {dateRangeLabel}
          </div>

          {/* ── Cash Book Table ──────────────────────────────────────── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
                border: "1px solid #ccc",
                borderRadius: "4px",
                marginBottom: "14px",
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
                    <th style={th}>{t.dateLabel}</th>
                    <th style={th}>{t.description}</th>
                    <th style={th}>{t.party}</th>
                    <th style={th}>{t.method}</th>
                    <th style={{ ...th, color: "#1a6600" }}>{t.receipt}</th>
                    <th style={{ ...th, color: "#990000" }}>{t.payment}</th>
                    <th style={th}>{t.balance}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr style={{ backgroundColor: "#f5f5f5", fontStyle: "italic" }}>
                    <td style={tdC}>—</td>
                    <td style={td} colSpan={3}>
                      {t.openingBalance}
                    </td>
                    <td style={tdR}></td>
                    <td style={tdR}></td>
                    <td style={{ ...tdR, fontWeight: "bold" }}>0.00</td>
                  </tr>

                  {enriched.map((e, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor:
                          e.type === "receipt" ? "#f0fff4" : "#fff5f5",
                      }}
                    >
                      <td style={tdC}>{fmtDate(e.date)}</td>
                      <td style={td}>{e.description}</td>
                      <td style={td}>{e.party}</td>
                      <td style={tdC}>{e.method || "—"}</td>
                      <td
                        style={{
                          ...tdR,
                          color: "#1a6600",
                          fontWeight: e.type === "receipt" ? "bold" : "normal",
                        }}
                      >
                        {e.type === "receipt" ? fmt(e.amount) : ""}
                      </td>
                      <td
                        style={{
                          ...tdR,
                          color: "#990000",
                          fontWeight: e.type === "payment" ? "bold" : "normal",
                        }}
                      >
                        {e.type === "payment" ? fmt(e.amount) : ""}
                      </td>
                      <td
                        style={{
                          ...tdR,
                          fontWeight:
                            idx === enriched.length - 1 ? "bold" : "normal",
                          color:
                            e.runningBalance < 0
                              ? "#990000"
                              : e.runningBalance > 0
                              ? "#1a6600"
                              : "inherit",
                        }}
                      >
                        {fmt(Math.abs(e.runningBalance))}
                        {e.runningBalance < 0
                          ? " Dr"
                          : e.runningBalance > 0
                          ? " Cr"
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Closing balance row */}
                  <tr
                    style={{
                      backgroundColor: "#f0f0f0",
                      fontWeight: "bold",
                    }}
                  >
                    <td style={td} colSpan={4}>
                      {t.closingBalance}
                    </td>
                    <td style={{ ...tdR, color: "#1a6600" }}>
                      {fmt(totalReceipts)}
                    </td>
                    <td style={{ ...tdR, color: "#990000" }}>
                      {fmt(totalPayments)}
                    </td>
                    <td
                      style={{
                        ...tdR,
                        fontSize: "11px",
                        color:
                          netBalance < 0
                            ? "#990000"
                            : netBalance > 0
                            ? "#1a6600"
                            : "inherit",
                      }}
                    >
                      {fmt(Math.abs(netBalance))}
                      {netBalance < 0 ? " Dr" : netBalance > 0 ? " Cr" : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Summary Box ──────────────────────────────────────────── */}
          {!loading && (
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
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "6px 20px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "#f0fff4",
                    border: "1px solid #b2dfdb",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555" }}>
                    {t.totalReceipts}
                  </div>
                  <div style={{ fontWeight: "bold", color: "#1a6600" }}>
                    ₹{fmt(totalReceipts)}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "#fff5f5",
                    border: "1px solid #ffcdd2",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555" }}>
                    {t.totalPayments}
                  </div>
                  <div style={{ fontWeight: "bold", color: "#990000" }}>
                    ₹{fmt(totalPayments)}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 8px",
                    backgroundColor: netBalance >= 0 ? "#e8f5e9" : "#fce4ec",
                    border: `1px solid ${netBalance >= 0 ? "#a5d6a7" : "#f48fb1"}`,
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555" }}>
                    {t.netBalance}
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      color: netBalance >= 0 ? "#1a6600" : "#990000",
                    }}
                  >
                    ₹{fmt(Math.abs(netBalance))}
                    {netBalance < 0 ? " Dr" : netBalance > 0 ? " Cr" : ""}
                  </div>
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
            <div>{today}</div>
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
