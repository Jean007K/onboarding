"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGS, lookup } from "../../lib/i18n";

const I18nContext = createContext(null);
const STORAGE = "ayiti-lang";

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("es");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE);
      if (LANGS.some((l) => l.id === saved)) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const value = useMemo(() => {
    function t(key) {
      return lookup(lang, key);
    }
    function setLang(next) {
      if (LANGS.some((l) => l.id === next)) setLangState(next);
    }
    return { lang, setLang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n needs I18nProvider");
  return ctx;
}
