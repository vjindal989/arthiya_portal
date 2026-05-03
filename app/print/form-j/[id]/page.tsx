"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

type Settings = Record<string, string>;

interface LotData {
  lot: {
    id: string;
    lotNumber: string;
    date: string;
    cropType: string;
    variety: string;
    netWeight: number;
    noOfBags: number;
    arhatiyaMode: string;
    farmer: { name: string; nameHindi?: string; village?: string; tehsil?: string };
    sale?: {
      ratePerQuintal: number;
      grossAmount: number;
      commission: number;
      labourCharges: number;
      gunnyBagCharges: number;
      otherDeductions: number;
      netFarmerAmount: number;
      saleDate: string;
      trader: { name: string; firmName?: string };
    };
    settlement?: { netPayable: number; loanDeductions: number; otherDeductions: number };
  };
  settings: Settings;
}

const L = {
  en: {
    mktCmte: "Market Committee",
    formJ: "FORM J",
    rule: "[See Rule 24 (14)]",
    kutcha: "Kutcha Arhatiya's Name",
    pucca: "Pucca Arhatiya's Name",
    commAgent: "(Commission Agent)",
    mobile: "Mob:",
    shop: "Shop No.",
    date: "Date of Auction",
    serialNo: "Sr. No.",
    sellerName: "Seller's Name",
    crop: "Commodity",
    buyer: "Buyer's Name",
    weight: "Weight",
    rate: "Rate",
    total: "Total",
    incCharges: "Incidental Charges",
    jhraai: "Commission",
    mazduri: "Labour",
    anyKharche: "Other Exp.",
    jor: "Total",
    netAmt: "Net Amt Paid",
    sellerSign: "Seller's Signature",
    arhatiyaSign: "Arhatiya's Signature",
    bags: "bags",
    qtl: "qtl",
    pan: "PAN",
    lic: "M.C. Lic No.",
  },
  hi: {
    mktCmte: "मार्किट कमेटी",
    formJ: "फार्म J",
    rule: "नियम 24 (14) देखें",
    kutcha: "कच्चे आढ़तिए का नाम",
    pucca: "पक्के आढ़तिए का नाम",
    commAgent: "(कमीशन एजेन्ट)",
    mobile: "मो:",
    shop: "दुकान नं.",
    date: "निलामी की तिथि",
    serialNo: "क्रमांक",
    sellerName: "बेचने वाले का नाम",
    crop: "वस्तु का नाम",
    buyer: "खरीददार का नाम",
    weight: "वजन",
    rate: "दर",
    total: "जोड़",
    incCharges: "प्रासंगिक व्यय",
    jhraai: "झराई",
    mazduri: "मजदूरी",
    anyKharche: "अन्य खर्चे",
    jor: "जोड़",
    netAmt: "अदा की गई नियत राशि",
    sellerSign: "बेचने वाले के हस्ताक्षर",
    arhatiyaSign: "कच्चे आढ़तिए के हस्ताक्षर",
    bags: "बोरे",
    qtl: "क्विं.",
    pan: "PAN",
    lic: "M.C. Lic No.",
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function FormJPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LotData | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("hi");

  useEffect(() => {
    fetch(`/api/print/lot/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>;
  }

  const { lot, settings } = data;
  const sale = lot.sale;
  const t = L[lang];
  const arhatiyaLabel = lot.arhatiyaMode === "PUCCA" ? t.pucca : t.kutcha;
  const arhatiyaSign = lot.arhatiyaMode === "PUCCA"
    ? (lang === "hi" ? "पक्के आढ़तिए के हस्ताक्षर" : "Pucca Arhatiya's Signature")
    : t.arhatiyaSign;

  const netWtQtl = lot.netWeight / 100;
  const totalDeductions = sale
    ? (sale.commission + sale.labourCharges + sale.gunnyBagCharges + sale.otherDeductions)
    : 0;
  const netPaid = lot.settlement
    ? lot.settlement.netPayable
    : sale?.netFarmerAmount ?? 0;

  return (
    <>
      {/* Controls — hidden on print */}
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
          🖨 Print
        </button>
        <span className="text-gray-300">Form J — {lot.lotNumber}</span>
        <span className="ml-auto text-gray-400 text-xs">Use Ctrl+P or click Print</span>
      </div>

      {/* Form — A5 landscape paper */}
      <div
        className="print:pt-0 pt-12 bg-white"
        style={{ fontFamily: "'Noto Sans', 'Mangal', Arial, sans-serif" }}
      >
        <div
          className="mx-auto border border-black"
          style={{
            width: "210mm",
            minHeight: "148mm",
            padding: "4mm 5mm",
            fontSize: "11px",
          }}
        >
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "4px", marginBottom: "4px" }}>
            {/* Left */}
            <div style={{ fontSize: "10px" }}>
              <div style={{ fontWeight: "bold" }}>
                {t.mktCmte} - {settings.market_committee_name || "______"}
              </div>
              <div style={{ marginTop: "2px" }}>{arhatiyaLabel}</div>
              <div>{t.pan}: {settings.pan_number || "____________"}</div>
              <div>{t.lic}: {settings.mc_license_no || "____________"}</div>
            </div>

            {/* Center */}
            <div style={{ textAlign: "center", minWidth: "100mm" }}>
              <div style={{ fontWeight: "bold", fontSize: "13px" }}>{t.formJ}</div>
              <div style={{ fontSize: "9px", marginBottom: "1px" }}>{t.rule}</div>
              <div style={{ fontWeight: "bold", fontSize: "16px", lineHeight: 1.2 }}>
                {settings.firm_name_hindi || settings.firm_name}
              </div>
              <div style={{ fontSize: "9px" }}>
                {t.commAgent} {t.mobile} {settings.mobile1 || ""}{settings.mobile2 ? `, ${settings.mobile2}` : ""}
              </div>
              <div style={{ fontSize: "9px" }}>
                {t.shop} {settings.shop_no || ""}{settings.address ? `, ${settings.address}` : settings.mandi_name ? `, ${settings.mandi_name}` : ""}
              </div>
            </div>

            {/* Right */}
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                {lot.sale ? format(new Date(lot.sale.saleDate), "dd-MM-yyyy") : format(new Date(lot.date), "dd-MM-yyyy")}
              </div>
              <div>{t.date}</div>
              <div style={{ border: "1px solid black", display: "inline-block", padding: "2px 8px", marginTop: "4px", fontSize: "9px" }}>
                ATTESTED<br />Market Committee<br />{settings.market_committee_name || ""}
              </div>
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontWeight: "bold" }}>{t.serialNo} </span>{lot.lotNumber}
              </div>
            </div>
          </div>

          {/* Seller name */}
          <div style={{ borderTop: "1px solid black", paddingTop: "3px", marginBottom: "3px", fontSize: "11px" }}>
            {t.sellerName}:{" "}
            <span style={{ fontWeight: "bold" }}>
              {lot.farmer.nameHindi || lot.farmer.name}
            </span>
            {lot.farmer.village && ` — ${lot.farmer.village}`}
          </div>

          {/* Main table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={th} rowSpan={2}>{t.crop}</th>
                <th style={th} rowSpan={2}>{t.buyer}</th>
                <th style={th} rowSpan={2}>{t.weight}</th>
                <th style={th} rowSpan={2}>{t.rate}</th>
                <th style={th} rowSpan={2}>{t.total}</th>
                <th style={{ ...th, textAlign: "center" }} colSpan={4}>{t.incCharges}</th>
                <th style={th} rowSpan={2}>{t.netAmt}</th>
              </tr>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={th}>{t.jhraai}</th>
                <th style={th}>{t.mazduri}</th>
                <th style={th}>{t.anyKharche}</th>
                <th style={th}>{t.jor}</th>
              </tr>
            </thead>
            <tbody>
              {sale ? (
                <tr>
                  <td style={{ ...td, fontWeight: "bold" }}>
                    {lot.cropType}{lot.variety && lot.variety !== "Other" ? ` (${lot.variety})` : ""}
                  </td>
                  <td style={td}>
                    {sale.trader.firmName || sale.trader.name}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <div>{lot.noOfBags} {t.bags}</div>
                    <div style={{ fontWeight: "bold" }}>{fmt(netWtQtl)} {t.qtl}</div>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>{fmt(sale.ratePerQuintal)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>{fmt(sale.grossAmount)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{sale.commission > 0 ? fmt(sale.commission) : ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>{sale.labourCharges > 0 ? fmt(sale.labourCharges) : ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {(sale.gunnyBagCharges + sale.otherDeductions) > 0
                      ? fmt(sale.gunnyBagCharges + sale.otherDeductions)
                      : ""}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    {totalDeductions > 0 ? fmt(totalDeductions) : ""}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: "bold", fontSize: "12px" }}>
                    {fmt(netPaid)}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td style={td} colSpan={10}>
                    <span style={{ color: "#999" }}>Sale not recorded yet</span>
                  </td>
                </tr>
              )}
              {/* Empty rows for visual spacing */}
              {[...Array(3)].map((_, i) => (
                <tr key={i} style={{ height: "20px" }}>
                  {[...Array(10)].map((__, j) => <td key={j} style={td}>&nbsp;</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals row */}
          {sale && (
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid black", paddingTop: "3px", fontSize: "10px", marginTop: "2px" }}>
              <div>
                {lang === "hi" ? "कुल बोरे:" : "Total Bags:"} <strong>{lot.noOfBags}</strong>
                &nbsp;&nbsp;
                {lang === "hi" ? "कुल वजन:" : "Total Weight:"} <strong>{fmt(netWtQtl)} {t.qtl}</strong>
              </div>
              <div>
                {lang === "hi" ? "कुल कटौती:" : "Total Deductions:"} <strong>{fmt(totalDeductions)}</strong>
                &nbsp;&nbsp;
                {lang === "hi" ? "शुद्ध रकम:" : "Net Amount:"} <strong style={{ fontSize: "13px" }}>{fmt(netPaid)}</strong>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", paddingTop: "6px", borderTop: "1px solid black", fontSize: "10px" }}>
            <div>{t.sellerSign}:</div>
            <div>{arhatiyaSign}:</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { margin: 0; background: white; }
          @page { size: A5 landscape; margin: 5mm; }
        }
      `}</style>
    </>
  );
}

const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 4px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "10px",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 4px",
  verticalAlign: "top",
};
