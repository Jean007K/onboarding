"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { translateEstado } from "../../../lib/i18n";
import { CruceIdentidad } from "../../components/Cruce";
import { useI18n } from "../../components/I18nProvider";

export default function DetallePage() {
  const { t, lang } = useI18n();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const sol = await api(`/api/verificaciones/${id}`);
    setData(sol);
  }

  useEffect(() => {
    if (!id) return;
    load().catch((e) => setError(e.message));
  }, [id]);

  async function consultar() {
    setBusy(true);
    setError("");
    try {
      const res = await api(`/api/verificaciones/${id}/consultar`, { method: "POST" });
      setData(res.solicitud);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <div className="err" role="alert">{error}</div>;
  if (!data) return <p>{t("detail.loading")}</p>;

  const verdictKind = data.cuenta_apta
    ? "ok"
    : data.identidad?.estado === "no_coincide"
      ? "warn"
      : data.estado === "rechazado"
        ? "bad"
        : "wait";

  return (
    <>
      <h1>{t("detail.title")}</h1>
      <p className="lede">{t("detail.lede")}</p>
      {error ? <div className="err" role="alert">{error}</div> : null}

      <div className={`verdict ${verdictKind}`}>
        <p>
          <span className={`badge ${data.estado}`}>{translateEstado(lang, data.estado)}</span>
          {data.cuenta_apta ? <span className="verdict-dec">{t("detail.aptaBadge")}</span> : null}
        </p>
        <p className="verdict-copy">
          {data.cuenta_apta ? t("detail.aptaCopy") : data.identidad?.estado
            ? t(`cruce.resumen_${data.identidad.estado}`)
            : t("detail.noCruce")}
        </p>
      </div>

      <div className="panel">
        <div className="kv">
          <b>{t("detail.declared")}</b><span>{data.nombre} {data.apellido}</span>
          <b>{t("home.rut")}</b><span>{data.rut || "—"}</span>
          <b>{t("detail.email")}</b><span>{data.email}</span>
          <b>{t("detail.phone")}</b><span>{data.telefono || "-"}</span>
          <b>end_user_ref</b><span>{data.end_user_ref}</span>
          <b>session_id</b><span>{data.session_id}</span>
          <b>decision</b><span>{data.decision || "-"}</span>
          <b>approved</b><span>{String(data.approved)}</span>
          <b>{t("detail.event")}</b><span>{data.webhook_event || t("detail.notYet")}</span>
          <b>{t("detail.received")}</b><span>{data.webhook_recibido_at || "-"}</span>
        </div>
        <p className="actions">
          <button type="button" className="ghost" onClick={consultar} disabled={busy}>
            {busy ? t("detail.consulting") : t("detail.consult")}
          </button>
        </p>
      </div>

      <CruceIdentidad identidad={data.identidad} cuentaApta={data.cuenta_apta} />

      <h2>{t("detail.ocr")}</h2>
      <pre>{pretty(data.extracted_data, t)}</pre>
      <h2>Scores</h2>
      <pre>{pretty(data.scores, t)}</pre>
      <h2>Reasons</h2>
      <pre>{pretty(data.reasons, t)}</pre>
    </>
  );
}

function pretty(v, t) {
  if (!v) return t("detail.empty");
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
