"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { CruceIdentidad } from "../components/Cruce";

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
          // si la API key no esta o Idantite no responde, seguimos esperando el webhook
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
  }, [id]);

  if (error) return <div className="err" role="alert">{error}</div>;
  if (!data) return <p>Buscando tu expediente...</p>;

  const listo = ["aprobado", "rechazado", "revision"].includes(data.estado);

  return (
    <>
      <h1>Resultado de tu verificacion</h1>
      <p className="lede">
        Esta pantalla lee NUESTRA base. Idantite decide si el documento y la
        selfie son de la misma persona. Despues nuestro backend comprueba si
        esos datos son los que tu escribiste en el formulario.
      </p>

      <div className={`verdict ${verdictClass(data)}`}>
        <p>
          <span className={`badge ${data.estado}`}>{data.estado}</span>
          {data.decision ? <span className="verdict-dec">Idantite: {data.decision}</span> : null}
        </p>
        <p className="verdict-copy">{copyDecision(data, listo)}</p>
      </div>

      <CruceIdentidad identidad={data.identidad} cuentaApta={data.cuenta_apta} />

      <div className="panel">
        <div className="kv">
          <b>Solicitud</b>
          <span>{data.id}</span>
          <b>Persona declarada</b>
          <span>{data.nombre} {data.apellido}</span>
          <b>RUT</b>
          <span>{data.rut || "—"}</span>
          <b>Referencia</b>
          <span>{data.end_user_ref}</span>
          <b>Sesion Idantite</b>
          <span>{data.session_id || "-"}</span>
          <b>Webhook</b>
          <span>{data.webhook_event || "sin evento todavia"} {data.webhook_recibido_at}</span>
        </div>
        {!listo ? <p className="wait-note">Esperando confirmacion del servidor...</p> : null}
        <p className="actions">
          <a className="btn ghost" href={`/verificaciones/${data.id}`}>Ver expediente completo</a>
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

function copyDecision(data, listo) {
  if (!listo) {
    return "Todavia no hay decision. Si acabas de volver de la captura, espera unos segundos: el webhook puede tardar.";
  }
  if (data.cuenta_apta) {
    return "Identidad verificada y los datos del documento corresponden a los que ingresaste. En un producto real aqui se abriria la cuenta.";
  }
  if (data.estado === "aprobado" && data.identidad?.estado === "no_coincide") {
    return "Idantite verifico el documento, pero no corresponde a los datos que ingresaste. No se abre la cuenta.";
  }
  if (data.estado === "aprobado" && data.identidad?.estado === "incompleto") {
    return "Idantite verifico la identidad, pero el documento no trajo todos los campos para cruzarlos con el formulario.";
  }
  if (data.estado === "rechazado") {
    return "No se pudo verificar. El operador puede pedir una nueva captura desde el panel de Idantite.";
  }
  if (data.estado === "revision") {
    return "Un revisor tiene que mirar el caso en el panel de Idantite. Cuando decidan, llega otro webhook.";
  }
  return "Hay una decision, pero todavia no se completo el cruce de datos.";
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ResultadoInner />
    </Suspense>
  );
}
