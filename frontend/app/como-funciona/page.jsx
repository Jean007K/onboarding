export const metadata = {
  title: "Como funciona — Ayiti",
  description:
    "Como este cliente envia los datos a Idantite, recibe el webhook, los guarda y compara el formulario con el documento.",
};

export default function ComoFuncionaPage() {
  return (
    <article className="explain">
      <h1>Como esta armado este onboarding</h1>
      <p className="lede">
        Esta web no es Idantite. Es <strong>Ayiti</strong>, un cliente de ejemplo:
        el banco o la empresa que quiere abrir una cuenta. Idantite solo verifica
        la identidad. Aqui se ve, en orden, que hace cada lado: como se envian
        los datos, como llegan, donde se guardan y como se comparan.
      </p>

      <nav className="toc" aria-label="En esta pagina">
        <a href="#piezas">Las piezas</a>
        <a href="#camino">El camino</a>
        <a href="#cruce">La comparacion</a>
        <a href="#no-viaja">Lo que no viaja</a>
      </nav>

      <h2 id="piezas">Dos sistemas, no uno</h2>
      <div className="who">
        <div>
          <b>Ayiti (este sitio)</b>
          <p>
            Formulario, expediente en SQLite, pantalla de resultado y el cruce
            de nombres / apellidos / RUT. Backend en Go. La API key de Idantite
            vive solo ahi, nunca en el navegador.
          </p>
        </div>
        <div>
          <b>Idantite</b>
          <p>
            Sesion de verificacion, captura (selfie + documento), OCR, face
            match y el webhook firmado. Las fotos se quedan en su almacenamiento.
            Ayiti no las recibe.
          </p>
        </div>
      </div>
      <p>
        Si tu empresa usa Idantite de verdad, tu backend hace el mismo papel
        que este: guardar tu cliente, crear la sesion, recibir el webhook y
        decidir si abres la cuenta.
      </p>

      <h2 id="camino">El camino de los datos</h2>
      <p>
        La fuente de verdad no es la pantalla a la que vuelve el usuario. Es
        el webhook que Idantite pega a nuestro servidor, con firma HMAC.
      </p>

      <div className="flow">
        <article>
          <h3>1. El cliente escribe en el formulario</h3>
          <p>
            Nombres, apellidos, RUT, correo y telefono. Si hay espacios de mas
            o todo en minusculas, el navegador lo limpia al salir del campo y
            el backend lo vuelve a normalizar antes de guardar. Eso no es
            Idantite: es Ayiti cuidando su propio expediente.
          </p>
        </article>
        <article>
          <h3>2. Se envian al backend de Ayiti</h3>
          <p>
            El navegador llama <code>POST /api/solicitudes</code> a{" "}
            <code>api.onboarding.ayiti.cc.cd</code>. No lleva la API key. El
            servidor crea una fila en SQLite (el expediente de esta empresa) y
            recien ahi habla con Idantite: <code>POST /v2/sessions</code> con
            header <code>X-API-Key</code> y un <code>end_user_ref</code> nuestro,
            para saber despues de quien era el resultado.
          </p>
        </article>
        <article>
          <h3>3. Idantite responde con una sesion de captura</h3>
          <p>
            Devuelve <code>session_id</code> y <code>share_token</code>. Ayiti
            los guarda y manda al navegador a{" "}
            <code>validacion.genbia.qzz.io/?session=…&amp;t=…</code>. El celular
            nunca ve nuestra key: el <code>t=</code> es una llave chica, de esa
            sesion, que caduca.
          </p>
        </article>
        <article>
          <h3>4. La persona se saca selfie y documento</h3>
          <p>
            Eso ocurre en la web de Idantite, no en Ayiti. Ellos procesan OCR y
            face match. Nosotros no recibimos las imagenes. Recibimos decision,
            scores y texto extraido del documento.
          </p>
        </article>
        <article>
          <h3>5. Idantite nos pega el webhook</h3>
          <p>
            <code>POST /webhooks/idantite</code>. Header{" "}
            <code>X-IDANTITE-Signature</code> = HMAC-SHA256 del body crudo con
            el secret que guardamos al crear el webhook. Si la firma no cuadra,
            respondemos 401 y no actualizamos el expediente. Si cuadra, 200 y
            guardamos.
          </p>
          <pre>{`X-IDANTITE-Signature = hex(HMAC-SHA256(secret, body_crudo))`}</pre>
        </article>
        <article>
          <h3>6. Se guarda en SQLite y se compara</h3>
          <p>
            En el mismo expediente quedan: estado de Idantite (aprobado,
            rechazado, revision), scores, OCR y el resultado del modulo{" "}
            <code>identidad</code>. La pagina <code>/resultado</code> no le
            cree al redirect: lee esta base. Si el webhook tarda, el backend
            puede consultar <code>GET /v2/sessions/:id</code> como ultimo
            recurso. El webhook sigue siendo la via diaria.
          </p>
        </article>
      </div>

      <h2 id="cruce">La comparacion interna</h2>
      <p>
        Idantite responde a otra pregunta: ¿selfie y foto del documento son la
        misma persona? No mira lo que el cliente escribio en el formulario de
        Ayiti. Esa segunda pregunta la hace este backend.
      </p>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Lo que guardo Ayiti</th>
            <th>Lo que llega en el webhook</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nombres</td>
            <td>Formulario, ya limpio</td>
            <td>
              <code>extracted_data.nombres</code>
            </td>
          </tr>
          <tr>
            <td>Apellidos</td>
            <td>Formulario, ya limpio</td>
            <td>
              <code>extracted_data.apellidos</code>
            </td>
          </tr>
          <tr>
            <td>RUT</td>
            <td>Formulario (puntos y DV unificados)</td>
            <td>
              <code>extracted_data.rut</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Espacios, mayusculas y acentos no cuentan como diferencia. Un nombre
        mas corto que el del documento (Jean frente a JEAN KENEL) si puede
        coincidir. Un nombre de mas, no. El numero de documento del OCR no se
        pide ni se cruza: solo el RUT.
      </p>
      <p>
        La cuenta se da por buena solo si las dos cosas salen bien: Idantite
        aprobo <em>y</em> el cruce coincide (<code>cuenta_apta</code>). Si
        aprobo el documento de otra persona, el expediente queda verificado
        pero <strong>no coincide</strong>: no se abre la cuenta.
      </p>

      <h2 id="no-viaja">Lo que no viaja</h2>
      <ul>
        <li>
          La API key no sale del servidor de Ayiti. El JavaScript del
          navegador no la tiene.
        </li>
        <li>
          Las fotos no llegan a este backend. El operador las ve en el panel
          de Idantite, no en los expedientes de Ayiti.
        </li>
        <li>
          Volver a <code>/resultado</code> no prueba nada por si solo. Si el
          webhook no llego, el caso sigue pendiente.
        </li>
      </ul>

      <p className="actions">
        <a className="btn" href="/">
          Probar una solicitud
        </a>{" "}
        <a className="btn ghost" href="/verificaciones">
          Ver expedientes
        </a>
      </p>
    </article>
  );
}
