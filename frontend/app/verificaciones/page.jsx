"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

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
        Sirve para consultar despues si la persona ya fue verificada.
      </p>
      {error ? <div className="err">{error}</div> : null}
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Persona</th>
              <th>Correo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5}>Todavia no hay solicitudes.</td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{(s.created_at || "").replace("T", " ").slice(0, 19)}</td>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.email}</td>
                  <td><span className={`badge ${s.estado}`}>{s.estado}</span></td>
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
