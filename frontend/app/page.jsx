"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { tidyNombre, tidyRut, tituloNombre } from "../lib/datos";
import { useI18n } from "./components/I18nProvider";

const inicial = {
  nombre: "",
  apellido: "",
  rut: "",
  email: "",
  telefono: "",
};

export default function HomePage() {
  const { t } = useI18n();
  const [form, setForm] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function blurNombre(k) {
    setForm((prev) => ({ ...prev, [k]: tituloNombre(prev[k]) }));
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
      <h1>{t("home.title")}</h1>
      <p className="lede">
        {t("home.lede")}{" "}
        <a href="/como-funciona">{t("home.howLink")}</a>.
      </p>

      <form className="panel" onSubmit={onSubmit}>
        {error ? <div className="err" role="alert">{error}</div> : null}
        <div className="grid">
          <div>
            <label htmlFor="nombre">{t("home.nombres")}</label>
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
            <label htmlFor="apellido">{t("home.apellidos")}</label>
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
        <label htmlFor="rut">{t("home.rut")}</label>
        <input
          id="rut"
          name="rut"
          required
          value={form.rut}
          onChange={(e) => set("rut", e.target.value)}
          onBlur={blurRut}
        />
        <label htmlFor="email">{t("home.email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <label htmlFor="telefono">{t("home.telefono")}</label>
        <input
          id="telefono"
          name="telefono"
          autoComplete="tel"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
        <p className="hint">{t("home.hint")}</p>
        <button type="submit" disabled={busy}>
          {busy ? t("home.busy") : t("home.submit")}
        </button>
      </form>

      <div className="steps">
        <div>
          <b>{t("home.step1t")}</b>
          {t("home.step1")}
        </div>
        <div>
          <b>{t("home.step2t")}</b>
          {t("home.step2")}
        </div>
        <div>
          <b>{t("home.step3t")}</b>
          {t("home.step3")}
        </div>
      </div>
    </>
  );
}
