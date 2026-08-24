"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";

function ResultadoInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("falta el id de la solicitud en la URL");
      return;
    }
    let stop = false;
    async function tick() {
      try {
        const sol = await api(`/api/solicitudes/${id}`);
        if (!stop) setData(sol);
        const listo = ["aprobado", "rechazado", "revision"].includes(sol.estado);
        if (!listo && !stop) {
          // Si el webhook tarda, preguntamos a Idantite desde NUESTRO backend.
          try {
            await api(`/api/verificaciones/${id}/consultar`, { method: "POST" });
          } catch {
            // si la API key no esta o Idantite no responde, seguimos esperando el webhook
          }
        }
      } catch (err) {
        if (!stop) setError(err.message);
      }
    }
    tick();
    const t = setInterval(tick, 2500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id]);

  if (error) return <div className="err">{error}</div>;
  if (!data) return <p>Buscando tu expediente...</p>;

  const listo = ["aprobado", "rechazado", "revision"].includes(data.estado);

  return (
    <>
      <h1>Resultado de tu verificacion</h1>
      <p className="lede">
        Esta pantalla lee NUESTRA base. Si acabas de volver de Idantite y todavia
        dice pendiente, espera: el webhook puede tardar unos segundos.
      </p>
      <div className="panel">
        <p>
          <span className={`badge ${data.estado}`}>{data.estado}</span>
        </p>
        <div className="kv" style={{ marginTop: 16 }}>
          <b>Solicitud</b>
          <span>{data.id}</span>
          <b>Persona</b>
          <span>{data.nombre} {data.apellido}</span>
          <b>Referencia</b>
          <span>{data.end_user_ref}</span>
          <b>Sesion Idantite</b>
          <span>{data.session_id || "-"}</span>
          <b>Decision</b>
          <span>{data.decision || "todavia no llega"}</span>
          <b>Webhook</b>
          <span>{data.webhook_event || "sin evento todavia"} {data.webhook_recibido_at}</span>
        </div>
        {!listo ? <p style={{ marginTop: 18 }}>Esperando confirmacion del servidor...</p> : null}
        {data.estado === "aprobado" ? <p style={{ marginTop: 18 }}>Identidad verificada. En un producto real aqui abririas la cuenta.</p> : null}
        {data.estado === "rechazado" ? <p style={{ marginTop: 18 }}>No se pudo verificar. El operador puede pedir una nueva captura desde el panel de Idantite.</p> : null}
        {data.estado === "revision" ? <p style={{ marginTop: 18 }}>Un revisor tiene que mirar el caso en el panel de Idantite. Cuando decidan, llega otro webhook.</p> : null}
        <p style={{ marginTop: 20 }}>
          <a className="btn ghost" href={`/verificaciones/${data.id}`}>Ver expediente completo</a>
        </p>
      </div>
    </>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ResultadoInner />
    </Suspense>
  );
}
