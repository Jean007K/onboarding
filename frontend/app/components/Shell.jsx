"use client";

import { LANGS } from "../../lib/i18n";
import { useI18n } from "./I18nProvider";

export default function Shell({ children }) {
  const { t, lang, setLang } = useI18n();

  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href="/">
          <span className="mark" aria-hidden="true" />
          <span>
            <strong>{t("meta.brand")}</strong>
            <small>{t("meta.tagline")}</small>
          </span>
        </a>
        <div className="top-end">
          <nav>
            <a href="/">{t("nav.new")}</a>
            <a href="/verificaciones">{t("nav.files")}</a>
            <a href="/como-funciona">{t("nav.how")}</a>
          </nav>
          <div className="lang" role="group" aria-label={t("lang.group")}>
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                aria-label={item.name}
                onClick={() => setLang(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        {t("footer")}{" "}
        <a href="/como-funciona">{t("nav.how")}</a>.
      </footer>
    </div>
  );
}
