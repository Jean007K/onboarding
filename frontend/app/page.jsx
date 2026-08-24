"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function HomePage() {
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify(form),
      });
      // El usuario sale de NUESTRA web y entra a la captura de Idantite.
      window.location.href = data.capture_url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Abre tu cuenta</h1>
      <p className="lede">
        Completa tus datos y te vamos a pedir una selfie y una foto de tu documento.
        Eso lo hace Idantite. Cuando termines, vuelves aqui. Nosotros solo damos
        la cuenta por verificada cuando nuestro servidor recibe el webhook firmado.
      </p>

      <form className="panel" onSubmit={onSubmit}>
        {error ? <div className="err">{error}</div> : null}
        <div className="grid">
          <div>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>
          <div>
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" required value={form.apellido} onChange={(e) => set("apellido", e.target.value)} />
          </div>
        </div>
        <label htmlFor="email">Correo</label>
        <input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <label htmlFor="telefono">Telefono</label>
        <input id="telefono" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
        <button type="submit" disabled={busy}>
          {busy ? "Creando sesion..." : "Continuar a verificacion"}
        </button>
      </form>

      <div className="steps">
        <div>
          <b>1. Tus datos</b>
          Quedan en nuestra base SQLite, con una referencia que mandamos a Idantite.
        </div>
        <div>
          <b>2. Captura</b>
          Selfie y documento en validacion.genbia.qzz.io. Ahi no viaja nuestra API key.
        </div>
        <div>
          <b>3. Webhook</b>
          Idantite pega a nuestro backend. Si la firma HMAC es buena, guardamos el resultado.
        </div>
      </div>
    </>
  );
}
