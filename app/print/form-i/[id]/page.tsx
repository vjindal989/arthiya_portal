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
    farmer: { name: string };
    sale?: {
      ratePerQuintal: number;
      grossAmount: number;
      marketFee: number;
      rdf: number;
      commission: number;
      labourCharges: number;
      gunnyBagCharges: number;
      otherDeductions: number;
      netFarmerAmount: number;
      buyerTotalAmount: number;
      saleDate: string;
      trader: { name: string; firmName?: string };
    };
  };
  settings: Settings;
}

const L = {
  en: {
    mktCmte: "Market Committee",
    formI: "FORM I",
    rule: "[See Rule 24 (12) & (14)]",
    kutcha: "Kutcha Arhatiya's Name",
    commAgent: "(Commission Agent)",
    mobile: "Mob:",
    shop: "Shop No.",
    date: "Date of Auction",
    serialNo: "Sr. No.",
    buyerName: "Buyer's Name",
    crop: "Commodity",
    weight: "Weight",
    rate: "Rate",
    totalAmt: "Total Amount",
    mktCharges: "Market Charges",
    aadat: "Commission",
    tulai: "Weighment",
    dalali: "Brokerage",
    palledari: "Loading",
    mktTax: "Market Tax",
    upkar: "Cess (RDF)",
    anyKharche: "Other",
    jor: "Total",
    vatTax: "VAT Tax",
    grandTotal: "Grand Total",
    buyerSign: "Buyer's Signature",
    arhatiyaSign: "Arhatiya's Signature",
    bags: "bags",
    qtl: "qtl",
    rs: "Rs.",
    ps: "Ps.",
    pan: "PAN",
    lic: "M.C. Lic No.",
  },
  hi: {
    mktCmte: "मार्किट कमेटी",
    formI: "फार्म I",
    rule: "[नियम 24 (12) और (14) देखें]",
    kutcha: "कच्चे आढ़तिए का नाम",
    commAgent: "(कमीशन एजेन्ट)",
    mobile: "मो:",
    shop: "दुकान नं.",
    date: "निलामी की तिथि",
    serialNo: "क्रमांक",
    buyerName: "खरीददार का नाम",
    crop: "जेन्स का नाम",
    weight: "वजन",
    rate: "दर",
    totalAmt: "कुल रकम",
    mktCharges: "मार्किट प्रभार",
    aadat: "आढ़त",
    tulai: "तुलाई",
    dalali: "दलाली",
    palledari: "पलेदारी",
    mktTax: "मार्किट टैक्स",
    upkar: "उपकर",
    anyKharche: "अन्य खर्चे",
    jor: "जोड़",
    vatTax: "वैट टैक्स",
    grandTotal: "कुल जोड़",
    buyerSign: "रीदने वाले के हस्ताक्षर",
    arhatiyaSign: "कच्चे आढ़तिए के हस्ताक्षर",
    bags: "बोरे",
    qtl: "क्विं.",
    rs: "रू०",
    ps: "पै०",
    pan: "PAN",
    lic: "M.C. Lic No.",
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function splitPaise(n: number) {
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  return { rs: rupees.toLocaleString("en-IN"), ps: paise > 0 ? String(paise).padStart(2, "0") : "—" };
}

export default function FormIPage() {
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

  const netWtQtl = lot.netWeight / 100;
  const totalMktCharges = sale ? (sale.commission + sale.marketFee + sale.rdf + sale.labourCharges + sale.gunnyBagCharges + sale.otherDeductions) : 0;
  const gtAmt = sale ? splitPaise(sale.buyerTotalAmount + sale.commission + sale.labourCharges + sale.gunnyBagCharges + sale.otherDeductions) : null;

  // buyerTotalAmount = grossAmount + marketFee + rdf (from calc.ts)
  // But in Form-I the grand total = grossAmount + all market charges including commission
  const grandTotal = sale
    ? sale.grossAmount + sale.marketFee + sale.rdf + sale.commission + sale.labourCharges + sale.gunnyBagCharges + sale.otherDeductions
    : 0;

  return (
    <>
      {/* Controls */}
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
        <span className="text-gray-300">Form I — {lot.lotNumber}</span>
      </div>

      <div
        className="print:pt-0 pt-12 bg-white"
        style={{ fontFamily: "'Noto Sans', 'Mangal', Arial, sans-serif" }}
      >
        <div
          className="mx-auto border border-black"
          style={{ width: "210mm", minHeight: "148mm", padding: "4mm 5mm", fontSize: "11px" }}
        >
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "4px", marginBottom: "4px" }}>
            <div style={{ fontSize: "10px" }}>
              <div style={{ fontWeight: "bold" }}>{t.mktCmte} - {settings.market_committee_name || "______"}</div>
              <div style={{ marginTop: "2px" }}>{t.kutcha}</div>
              <div>{t.pan}: {settings.pan_number || "____________"}</div>
              <div>{t.lic}: {settings.mc_license_no || "____________"}</div>
            </div>

            <div style={{ textAlign: "center", minWidth: "100mm" }}>
              <div style={{ fontWeight: "bold", fontSize: "13px" }}>{t.formI}</div>
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

            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                {sale ? format(new Date(sale.saleDate), "dd-MM-yyyy") : format(new Date(lot.date), "dd-MM-yyyy")}
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

          {/* Buyer name */}
          <div style={{ borderTop: "1px solid black", paddingTop: "3px", marginBottom: "3px", fontSize: "11px" }}>
            {t.buyerName}:{" "}
            <span style={{ fontWeight: "bold" }}>
              {sale ? (sale.trader.firmName || sale.trader.name) : "___________________"}
            </span>
          </div>

          {/* Main table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ ...th, width: "10%" }} rowSpan={2}>{t.crop}</th>
                <th style={{ ...th, width: "18%" }} rowSpan={2}>{t.weight}</th>
                <th style={{ ...th, width: "8%" }} rowSpan={2}>{t.rate}</th>
                <th style={{ ...th, width: "16%" }} colSpan={2}>{t.totalAmt}</th>
                <th style={{ ...th, width: "32%" }} colSpan={8}>{t.mktCharges}</th>
                <th style={{ ...th, width: "7%" }} rowSpan={2}>{t.vatTax}</th>
                <th style={{ ...th, width: "9%" }} rowSpan={2}>{t.grandTotal}</th>
              </tr>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={th}>{t.rs}</th>
                <th style={th}>{t.ps}</th>
                <th style={th}>{t.aadat}</th>
                <th style={th}>{t.tulai}</th>
                <th style={th}>{t.dalali}</th>
                <th style={th}>{t.palledari}</th>
                <th style={th}>{t.mktTax}</th>
                <th style={th}>{t.upkar}</th>
                <th style={th}>{t.anyKharche}</th>
                <th style={{ ...th, fontWeight: "bold" }}>{t.jor}</th>
              </tr>
            </thead>
            <tbody>
              {sale ? (
                <>
                  <tr>
                    <td style={{ ...td, fontWeight: "bold" }} rowSpan={3}>
                      {lot.cropType}{lot.variety && lot.variety !== "Other" ? ` (${lot.variety})` : ""}
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      {lot.noOfBags} {t.bags} — {fmt(netWtQtl)} {t.qtl}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(sale.ratePerQuintal)}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {splitPaise(sale.grossAmount).rs}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {splitPaise(sale.grossAmount).ps}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.commission > 0 ? fmt(sale.commission) : ""}</td>
                    <td style={td}></td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.labourCharges > 0 ? fmt(sale.labourCharges) : ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.gunnyBagCharges > 0 ? fmt(sale.gunnyBagCharges) : ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.marketFee > 0 ? fmt(sale.marketFee) : ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.rdf > 0 ? fmt(sale.rdf) : ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{sale.otherDeductions > 0 ? fmt(sale.otherDeductions) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                      {totalMktCharges > 0 ? fmt(totalMktCharges) : ""}
                    </td>
                    <td style={td}></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "bold", fontSize: "12px" }} rowSpan={3}>
                      {fmt(grandTotal)}
                    </td>
                  </tr>
                  {/* Gross total row */}
                  <tr>
                    <td style={{ ...td, borderTop: "1px solid black", textAlign: "right" }}>
                      ────→
                    </td>
                    <td style={td}></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "bold", borderTop: "1px solid black" }}>
                      {splitPaise(sale.grossAmount).rs}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "bold", borderTop: "1px solid black" }}>
                      {splitPaise(sale.grossAmount).ps}
                    </td>
                    <td colSpan={7} style={{ ...td, textAlign: "right" }}>
                      {lang === "hi" ? "जोड़" : "Total"} {fmt(totalMktCharges)}
                    </td>
                    <td style={td}></td>
                  </tr>
                  <tr>
                    {[...Array(13)].map((_, i) => <td key={i} style={{ ...td, height: "18px" }}>&nbsp;</td>)}
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={15} style={{ ...td, textAlign: "center", color: "#999" }}>
                    Sale not recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Signatures */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", paddingTop: "6px", borderTop: "1px solid black", fontSize: "10px" }}>
            <div>{t.buyerSign}:</div>
            <div>{t.arhatiyaSign}:</div>
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
  fontSize: "9px",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 4px",
  verticalAlign: "top",
  fontSize: "10px",
};
