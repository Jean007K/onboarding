"use client";

import { useI18n } from "../components/I18nProvider";

export default function ComoFuncionaPage() {
  const { t } = useI18n();
  return (
    <article className="explain">
      <h1>{t("how.title")}</h1>
      <p className="lede">
        {t("how.ledeBefore")}
        <strong>Onboarding</strong>
        {t("how.ledeAfter")}
      </p>

      <nav className="toc" aria-label={t("how.toc")}>
        <a href="#piezas">{t("how.tocPiezas")}</a>
        <a href="#camino">{t("how.tocCamino")}</a>
        <a href="#cruce">{t("how.tocCruce")}</a>
        <a href="#no-viaja">{t("how.tocNo")}</a>
      </nav>

      <h2 id="piezas">{t("how.two")}</h2>
      <div className="who">
        <div>
          <b>{t("how.ayiti")}</b>
          <p>{t("how.ayitiP")}</p>
        </div>
        <div>
          <b>Emverax</b>
          <p>{t("how.idantiteP")}</p>
        </div>
      </div>
      <p>{t("how.same")}</p>

      <h2 id="camino">{t("how.path")}</h2>
      <p>{t("how.pathP")}</p>

      <div className="flow">
        <article>
          <h3>{t("how.s1t")}</h3>
          <p>{t("how.s1")}</p>
        </article>
        <article>
          <h3>{t("how.s2t")}</h3>
          <p>
            {t("how.s2a")}
            <code>POST /api/solicitudes</code>
            {t("how.s2b")}
            <code>api.onboarding.ayiti.cc.cd</code>
            {t("how.s2c")}
            <code>POST /v2/sessions</code>
            {t("how.s2d")}
            <code>X-API-Key</code>
            {t("how.s2e")}
            <code>end_user_ref</code>
            {t("how.s2f")}
          </p>
        </article>
        <article>
          <h3>{t("how.s3t")}</h3>
          <p>
            {t("how.s3a")}
            <code>session_id</code>
            {t("how.s3b")}
            <code>share_token</code>
            {t("how.s3c")}
            <code>verify.emverax.com/?session=…&amp;t=…</code>
            {t("how.s3d")}
            <code>t=</code>
            {t("how.s3e")}
          </p>
        </article>
        <article>
          <h3>{t("how.s4t")}</h3>
          <p>{t("how.s4")}</p>
        </article>
        <article>
          <h3>{t("how.s5t")}</h3>
          <p>
            <code>POST /webhooks/idantite</code>
            {t("how.s5a")}
            <code>X-IDANTITE-Signature</code>
            {t("how.s5b")}
          </p>
          <pre>{`X-IDANTITE-Signature = hex(HMAC-SHA256(secret, body_crudo))`}</pre>
        </article>
        <article>
          <h3>{t("how.s6t")}</h3>
          <p>
            {t("how.s6a")}
            <code>identidad</code>
            {t("how.s6b")}
            <code>/resultado</code>
            {t("how.s6c")}
            <code>GET /v2/sessions/:id</code>
            {t("how.s6d")}
          </p>
        </article>
      </div>

      <h2 id="cruce">{t("how.compare")}</h2>
      <p>{t("how.compareP")}</p>
      <table>
        <thead>
          <tr>
            <th>{t("how.thField")}</th>
            <th>{t("how.thAyiti")}</th>
            <th>{t("how.thHook")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("fields.nombres")}</td>
            <td>{t("how.formClean")}</td>
            <td>
              <code>extracted_data.nombres</code>
            </td>
          </tr>
          <tr>
            <td>{t("fields.apellidos")}</td>
            <td>{t("how.formClean")}</td>
            <td>
              <code>extracted_data.apellidos</code>
            </td>
          </tr>
          <tr>
            <td>{t("fields.rut")}</td>
            <td>{t("how.formRut")}</td>
            <td>
              <code>extracted_data.rut</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>{t("how.compareNote")}</p>
      <p>
        {t("how.apta")}
        <code>cuenta_apta</code>
        {t("how.apta2")}
        <strong>{t("how.apta3")}</strong>
        {t("how.apta4")}
      </p>

      <h2 id="no-viaja">{t("how.noTravel")}</h2>
      <ul>
        <li>{t("how.no1")}</li>
        <li>{t("how.no2")}</li>
        <li>
          {t("how.no3a")}
          <code>/resultado</code>
          {t("how.no3b")}
        </li>
      </ul>

      <p className="actions">
        <a className="btn" href="/">
          {t("how.try")}
        </a>{" "}
        <a className="btn ghost" href="/verificaciones">
          {t("how.seeFiles")}
        </a>
      </p>
    </article>
  );
}
