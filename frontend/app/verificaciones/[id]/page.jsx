"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

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

  if (error && !data) return <div className="err">{error}</div>;
  if (!data) return <p>Cargando expediente...</p>;

  return (
    <>
      <h1>Expediente</h1>
      <p className="lede">
        Si el webhook ya llego, aqui estan decision, scores y datos del documento.
        Si no, puedes consultar la API de Idantite (eso tambien usa la API key, solo en el servidor).
      </p>
      {error ? <div className="err">{error}</div> : null}
      <div className="panel">
        <p><span className={`badge ${data.estado}`}>{data.estado}</span></p>
        <div className="kv" style={{ marginTop: 16 }}>
          <b>Nombre</b><span>{data.nombre} {data.apellido}</span>
          <b>Correo</b><span>{data.email}</span>
          <b>Telefono</b><span>{data.telefono || "-"}</span>
          <b>end_user_ref</b><span>{data.end_user_ref}</span>
          <b>session_id</b><span>{data.session_id}</span>
          <b>decision</b><span>{data.decision || "-"}</span>
          <b>approved</b><span>{String(data.approved)}</span>
          <b>evento webhook</b><span>{data.webhook_event || "todavia no"}</span>
          <b>recibido</b><span>{data.webhook_recibido_at || "-"}</span>
        </div>
        <p style={{ marginTop: 18 }}>
          <button type="button" className="ghost" onClick={consultar} disabled={busy}>
            {busy ? "Consultando..." : "Consultar Idantite ahora"}
          </button>
        </p>
      </div>

      <h2 style={{ marginTop: 28 }}>Datos extraidos (OCR)</h2>
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
