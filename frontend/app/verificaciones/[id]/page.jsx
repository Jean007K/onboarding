"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { CruceIdentidad } from "../../components/Cruce";

export default function DetallePage() {
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
  if (!data) return <p>Cargando expediente...</p>;

  return (
    <>
      <h1>Expediente</h1>
      <p className="lede">
        Decision de Idantite y cruce de datos que hace este backend. Las fotos
        no salen de Idantite; aqui solo llega OCR, scores y la firma HMAC.
      </p>
      {error ? <div className="err" role="alert">{error}</div> : null}

      <div className={`verdict ${data.cuenta_apta ? "ok" : data.identidad?.estado === "no_coincide" ? "warn" : data.estado === "rechazado" ? "bad" : "wait"}`}>
        <p>
          <span className={`badge ${data.estado}`}>{data.estado}</span>
          {data.cuenta_apta ? <span className="verdict-dec">Cuenta apta</span> : null}
        </p>
        <p className="verdict-copy">
          {data.cuenta_apta
            ? "Verificacion correcta y los datos coinciden con el formulario."
            : data.identidad?.resumen || "Todavia no hay cruce."}
        </p>
      </div>

      <div className="panel">
        <div className="kv">
          <b>Nombre declarado</b><span>{data.nombre} {data.apellido}</span>
          <b>Numero de identidad</b><span>{data.numero_identidad || "—"}</span>
          <b>RUT</b><span>{data.rut || "—"}</span>
          <b>Correo</b><span>{data.email}</span>
          <b>Telefono</b><span>{data.telefono || "-"}</span>
          <b>end_user_ref</b><span>{data.end_user_ref}</span>
          <b>session_id</b><span>{data.session_id}</span>
          <b>decision</b><span>{data.decision || "-"}</span>
          <b>approved</b><span>{String(data.approved)}</span>
          <b>evento webhook</b><span>{data.webhook_event || "todavia no"}</span>
          <b>recibido</b><span>{data.webhook_recibido_at || "-"}</span>
        </div>
        <p className="actions">
          <button type="button" className="ghost" onClick={consultar} disabled={busy}>
            {busy ? "Consultando..." : "Consultar Idantite ahora"}
          </button>
        </p>
      </div>

      <CruceIdentidad identidad={data.identidad} cuentaApta={data.cuenta_apta} />

      <h2>Datos extraidos (OCR)</h2>
      <pre>{pretty(data.extracted_data)}</pre>
      <h2>Scores</h2>
      <pre>{pretty(data.scores)}</pre>
      <h2>Reasons</h2>
      <pre>{pretty(data.reasons)}</pre>
    </>
  );
}

function pretty(v) {
  if (!v) return "(vacio)";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
