"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "hi";

const translations = {
  en: {
    dashboard: "Dashboard",
    farmers: "Farmers",
    traders: "Traders",
    lots: "Lots",
    loans: "Loans",
    ledger: "Ledger",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    addFarmer: "Add Farmer",
    addTrader: "Add Trader",
    newLot: "New Lot",
    newLoan: "New Loan",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    search: "Search...",
    name: "Name",
    mobile: "Mobile",
    village: "Village",
    tehsil: "Tehsil",
    actions: "Actions",
    status: "Status",
    date: "Date",
    amount: "Amount",
    balance: "Balance",
    crop: "Crop",
    weight: "Weight",
    rate: "Rate",
    pending: "Pending",
    sold: "Sold",
    settled: "Settled",
    commission: "Commission",
    marketFee: "Market Fee",
    rdf: "Rural Dev. Fund",
    labour: "Labour",
    netAmount: "Net Amount",
    grossAmount: "Gross Amount",
    today: "Today",
    season: "Season",
    print: "Print",
    language: "Language",
    firmName: "Firm Name",
    mandiName: "Mandi",
    // Dashboard
    todayLots: "Today's Lots",
    pendingSale: "Pending Sale",
    pendingSettlement: "Pending Settlement",
    todayCommission: "Today's Commission",
    outstandingLoans: "Outstanding Loans",
    recentActivity: "Recent Activity",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    farmers: "किसान",
    traders: "व्यापारी",
    lots: "लॉट",
    loans: "कर्ज",
    ledger: "खाता",
    reports: "रिपोर्ट",
    settings: "सेटिंग",
    logout: "लॉगआउट",
    addFarmer: "किसान जोड़ें",
    addTrader: "व्यापारी जोड़ें",
    newLot: "नया लॉट",
    newLoan: "नया कर्ज",
    save: "सेव करें",
    cancel: "रद्द करें",
    edit: "संपादन",
    delete: "हटाएं",
    view: "देखें",
    search: "खोजें...",
    name: "नाम",
    mobile: "मोबाइल",
    village: "गांव",
    tehsil: "तहसील",
    actions: "कार्रवाई",
    status: "स्थिति",
    date: "तारीख",
    amount: "राशि",
    balance: "बैलेंस",
    crop: "फसल",
    weight: "वजन",
    rate: "दर",
    pending: "लंबित",
    sold: "बिका",
    settled: "हिसाब हुआ",
    commission: "आढ़त",
    marketFee: "मंडी शुल्क",
    rdf: "ग्रामीण विकास फंड",
    labour: "मजदूरी",
    netAmount: "शुद्ध राशि",
    grossAmount: "सकल राशि",
    today: "आज",
    season: "सीजन",
    print: "प्रिंट",
    language: "भाषा",
    firmName: "फर्म का नाम",
    mandiName: "मंडी",
    // Dashboard
    todayLots: "आज के लॉट",
    pendingSale: "बिक्री बाकी",
    pendingSettlement: "हिसाब बाकी",
    todayCommission: "आज की आढ़त",
    outstandingLoans: "बकाया कर्ज",
    recentActivity: "हाल की गतिविधि",
  },
};

type Translations = typeof translations.en;

interface I18nContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const I18nCtx = createContext<I18nContext>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("arhatiya_lang") as Lang;
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("arhatiya_lang", l);
  };

  return (
    <I18nCtx.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nCtx.Provider>
  );
}

export const useI18n = () => useContext(I18nCtx);
