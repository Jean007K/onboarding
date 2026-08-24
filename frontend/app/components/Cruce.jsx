"use client";

import { fieldLabel, translateCruceEstado } from "../../lib/i18n";
import { useI18n } from "./I18nProvider";

export function CruceIdentidad({ identidad, cuentaApta, compact }) {
  const { t, lang } = useI18n();
  const estado = identidad?.estado || "pendiente";
  const resumenKey = `cruce.resumen_${estado}`;
  const resumen =
    estado === "pendiente" || !identidad?.estado
      ? t("cruce.pending")
      : t(resumenKey) === resumenKey
        ? t("cruce.pending")
        : t(resumenKey);

  return (
    <section className={`cruce ${estado}`} aria-labelledby="cruce-title">
      <div className="cruce-head">
        <h2 id="cruce-title">{t("cruce.title")}</h2>
        <span className={`badge ${estado}`}>{translateCruceEstado(lang, estado)}</span>
      </div>
      <p className="cruce-resumen">{resumen}</p>
      {cuentaApta ? <p className="cruce-apta">{t("cruce.apta")}</p> : null}
      {identidad?.campos?.length ? (
        <table className="compare">
          <caption className="sr-only">{t("cruce.caption")}</caption>
          <thead>
            <tr>
              <th>{t("cruce.field")}</th>
              <th>{t("cruce.declared")}</th>
              <th>{t("cruce.document")}</th>
              <th>{t("cruce.match")}</th>
            </tr>
          </thead>
          <tbody>
            {identidad.campos.map((c) => (
              <tr key={c.campo}>
                <td>{fieldLabel(lang, c.campo, c.etiqueta)}</td>
                <td>{c.declarado || "—"}</td>
                <td>{c.documento || "—"}</td>
                <td>
                  <span className={`badge ${c.estado}`}>{translateCruceEstado(lang, c.estado)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : compact ? null : (
        <p className="cruce-empty">{t("cruce.empty")}</p>
      )}
    </section>
  );
}

export function BadgeCruce({ identidad }) {
  const { lang } = useI18n();
  const estado = identidad?.estado || "pendiente";
  return <span className={`badge ${estado}`}>{translateCruceEstado(lang, estado)}</span>;
}
