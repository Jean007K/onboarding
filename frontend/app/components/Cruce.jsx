function etiquetaEstado(estado) {
  if (estado === "coincide") return "Coincide";
  if (estado === "no_coincide") return "No coincide";
  if (estado === "sin_dato") return "Sin dato en el documento";
  if (estado === "incompleto") return "Incompleto";
  if (estado === "pendiente") return "Pendiente";
  return estado || "Pendiente";
}

export function CruceIdentidad({ identidad, cuentaApta, compact }) {
  const estado = identidad?.estado || "pendiente";
  const resumen =
    identidad?.resumen ||
    "Todavia no llega el webhook. El cruce se hace cuando Idantite confirma la captura.";

  return (
    <section className={`cruce ${estado}`} aria-labelledby="cruce-title">
      <div className="cruce-head">
        <h2 id="cruce-title">Datos declarados vs documento</h2>
        <span className={`badge ${estado}`}>{etiquetaEstado(estado)}</span>
      </div>
      <p className="cruce-resumen">{resumen}</p>
      {cuentaApta ? (
        <p className="cruce-apta">Listo para abrir la cuenta: identidad verificada y datos coinciden.</p>
      ) : null}
      {identidad?.campos?.length ? (
        <table className="compare">
          <caption className="sr-only">Comparacion campo por campo</caption>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Lo que ingreso el cliente</th>
              <th>Lo que dice el documento</th>
              <th>Cruce</th>
            </tr>
          </thead>
          <tbody>
            {identidad.campos.map((c) => (
              <tr key={c.campo}>
                <td>{c.etiqueta}</td>
                <td>{c.declarado || "—"}</td>
                <td>{c.documento || "—"}</td>
                <td>
                  <span className={`badge ${c.estado}`}>{etiquetaEstado(c.estado)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : compact ? null : (
        <p className="cruce-empty">El cruce aparece aqui cuando llega la decision de Idantite.</p>
      )}
    </section>
  );
}

export function badgeCruce(identidad) {
  const estado = identidad?.estado || "pendiente";
  return <span className={`badge ${estado}`}>{etiquetaEstado(estado)}</span>;
}
