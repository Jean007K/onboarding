"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { translateEstado } from "../../lib/i18n";
import { BadgeCruce } from "../components/Cruce";
import { useI18n } from "../components/I18nProvider";

export default function ListaPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/verificaciones")
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>{t("files.title")}</h1>
      <p className="lede">{t("files.lede")}</p>
      {error ? <div className="err" role="alert">{error}</div> : null}
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("files.date")}</th>
              <th>{t("files.person")}</th>
              <th>{t("home.rut")}</th>
              <th>{t("files.verification")}</th>
              <th>{t("files.data")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("files.empty")}</td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{(s.created_at || "").replace("T", " ").slice(0, 19)}</td>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.rut || "—"}</td>
                  <td><span className={`badge ${s.estado}`}>{translateEstado(lang, s.estado)}</span></td>
                  <td><BadgeCruce identidad={s.identidad} /></td>
                  <td><a href={`/verificaciones/${s.id}`}>{t("files.open")}</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
