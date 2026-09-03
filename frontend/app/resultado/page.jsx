"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { translateEstado } from "../../lib/i18n";
import { CruceIdentidad } from "../components/Cruce";
import { useI18n } from "../components/I18nProvider";

function ResultadoInner() {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const id = params.get("id") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError(t("result.missingId"));
      return;
    }
    let stop = false;
    let timer = null;
    async function tick() {
      try {
        const sol = await api(`/api/solicitudes/${id}`);
        if (stop) return;
        setData(sol);
        const listo = ["aprobado", "rechazado", "revision"].includes(sol.estado);
        if (listo) {
          if (timer) clearInterval(timer);
          return;
        }
        try {
          await api(`/api/verificaciones/${id}/consultar`, { method: "POST" });
        } catch {
          /* webhook remains the source of truth */
        }
      } catch (err) {
        if (!stop) setError(err.message);
      }
    }
    tick();
    timer = setInterval(tick, 2500);
    return () => {
      stop = true;
      if (timer) clearInterval(timer);
    };
  }, [id, t]);

  if (error) return <div className="err" role="alert">{error}</div>;
  if (!data) return <p>{t("result.loading")}</p>;

  const listo = ["aprobado", "rechazado", "revision"].includes(data.estado);

  return (
    <>
      <h1>{t("result.title")}</h1>
      <p className="lede">{t("result.lede")}</p>

      <div className={`verdict ${verdictClass(data)}`}>
        <p>
          <span className={`badge ${data.estado}`}>{translateEstado(lang, data.estado)}</span>
          {data.decision ? <span className="verdict-dec">Emverax: {data.decision}</span> : null}
        </p>
        <p className="verdict-copy">{copyDecision(t, data, listo)}</p>
      </div>

      <CruceIdentidad identidad={data.identidad} cuentaApta={data.cuenta_apta} />

      <div className="panel">
        <div className="kv">
          <b>{t("result.solicitud")}</b>
          <span>{data.id}</span>
          <b>{t("result.person")}</b>
          <span>{data.nombre} {data.apellido}</span>
          <b>{t("home.rut")}</b>
          <span>{data.rut || "—"}</span>
          <b>{t("result.ref")}</b>
          <span>{data.end_user_ref}</span>
          <b>{t("result.session")}</b>
          <span>{data.session_id || "-"}</span>
          <b>{t("result.webhook")}</b>
          <span>{data.webhook_event || t("result.webhookNone")} {data.webhook_recibido_at}</span>
        </div>
        {!listo ? <p className="wait-note">{t("result.wait")}</p> : null}
        <p className="actions">
          <a className="btn ghost" href={`/verificaciones/${data.id}`}>{t("result.file")}</a>
        </p>
      </div>
    </>
  );
}

function verdictClass(data) {
  if (data.cuenta_apta) return "ok";
  if (data.estado === "rechazado") return "bad";
  if (data.estado === "revision" || data.identidad?.estado === "no_coincide") return "warn";
  return "wait";
}

function copyDecision(t, data, listo) {
  if (!listo) return t("result.pending");
  if (data.cuenta_apta) return t("result.apta");
  if (data.estado === "aprobado" && data.identidad?.estado === "no_coincide") return t("result.mismatch");
  if (data.estado === "aprobado" && data.identidad?.estado === "incompleto") return t("result.incomplete");
  if (data.estado === "rechazado") return t("result.reject");
  if (data.estado === "revision") return t("result.review");
  return t("result.other");
}

export default function ResultadoPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<p>{t("result.loading")}</p>}>
      <ResultadoInner />
    </Suspense>
  );
}
