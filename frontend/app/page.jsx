"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { tidyDocumento, tidyNombre, tidyRut, tituloNombre } from "../lib/datos";

const inicial = {
  nombre: "",
  apellido: "",
  numero_identidad: "",
  rut: "",
  email: "",
  telefono: "",
};

export default function HomePage() {
  const [form, setForm] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function blurNombre(k) {
    setForm((prev) => ({ ...prev, [k]: tituloNombre(prev[k]) }));
  }

  function blurDocumento() {
    setForm((prev) => ({ ...prev, numero_identidad: tidyDocumento(prev.numero_identidad) }));
  }

  function blurRut() {
    setForm((prev) => ({ ...prev, rut: tidyRut(prev.rut) }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      ...form,
      nombre: tituloNombre(form.nombre),
      apellido: tituloNombre(form.apellido),
      numero_identidad: tidyDocumento(form.numero_identidad),
      rut: tidyRut(form.rut),
      email: tidyNombre(form.email).toLowerCase(),
      telefono: tidyNombre(form.telefono),
    };
    setForm(payload);
    try {
      const data = await api("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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
        Completa tus datos tal como aparecen en tu documento. Si dejas un espacio
        de mas o escribes en minusculas, lo corregimos al salir del campo.
        Despues te pedimos selfie y foto del documento (Idantite). La cuenta
        solo se da por buena si el webhook confirma la identidad y esos datos
        coinciden con lo que escribiste aqui.
      </p>

      <form className="panel" onSubmit={onSubmit}>
        {error ? <div className="err" role="alert">{error}</div> : null}
        <div className="grid">
          <div>
            <label htmlFor="nombre">Nombres</label>
            <input
              id="nombre"
              name="nombre"
              required
              autoComplete="given-name"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              onBlur={() => blurNombre("nombre")}
            />
          </div>
          <div>
            <label htmlFor="apellido">Apellidos</label>
            <input
              id="apellido"
              name="apellido"
              required
              autoComplete="family-name"
              value={form.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              onBlur={() => blurNombre("apellido")}
            />
          </div>
        </div>
        <div className="grid">
          <div>
            <label htmlFor="numero_identidad">Numero de identidad</label>
            <input
              id="numero_identidad"
              name="numero_identidad"
              required
              placeholder="B00.147.414"
              value={form.numero_identidad}
              onChange={(e) => set("numero_identidad", e.target.value)}
              onBlur={blurDocumento}
            />
          </div>
          <div>
            <label htmlFor="rut">RUT</label>
            <input
              id="rut"
              name="rut"
              required
              placeholder="25.925.129-K"
              value={form.rut}
              onChange={(e) => set("rut", e.target.value)}
              onBlur={blurRut}
            />
          </div>
        </div>
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <label htmlFor="telefono">Telefono</label>
        <input
          id="telefono"
          name="telefono"
          autoComplete="tel"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
        <p className="hint">
          Al salir de nombres, identidad o RUT, recortamos espacios y unificamos
          mayusculas. El backend vuelve a hacer lo mismo antes de guardar.
        </p>
        <button type="submit" disabled={busy}>
          {busy ? "Creando sesion..." : "Continuar a verificacion"}
        </button>
      </form>

      <div className="steps">
        <div>
          <b>1. Tus datos</b>
          Nombre, apellido, numero de identidad y RUT quedan en nuestra SQLite,
          ya limpios.
        </div>
        <div>
          <b>2. Captura</b>
          Selfie y documento en validacion.genbia.qzz.io. Ahi no viaja nuestra API key.
        </div>
        <div>
          <b>3. Cruce</b>
          El webhook llega firmado. Ademas de la decision de Idantite, comparamos
          OCR contra lo que escribiste.
        </div>
      </div>
    </>
  );
}
