"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { badgeCruce } from "../components/Cruce";

export default function ListaPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/verificaciones")
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Expedientes</h1>
      <p className="lede">
        Esto es lo que TU empresa guarda. No es el panel de Idantite.
        La columna de datos es el cruce entre el formulario y el OCR del webhook.
      </p>
      {error ? <div className="err" role="alert">{error}</div> : null}
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Persona</th>
              <th>RUT</th>
              <th>Verificacion</th>
              <th>Datos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>Todavia no hay solicitudes.</td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{(s.created_at || "").replace("T", " ").slice(0, 19)}</td>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.rut || "—"}</td>
                  <td><span className={`badge ${s.estado}`}>{s.estado}</span></td>
                  <td>{badgeCruce(s.identidad)}</td>
                  <td><a href={`/verificaciones/${s.id}`}>abrir</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
