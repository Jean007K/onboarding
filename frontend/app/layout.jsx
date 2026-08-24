import "./globals.css";

export const metadata = {
  title: "Ayiti — apertura de cuenta",
  description: "Demo de onboarding usando Idantite para verificar identidad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <header className="top">
            <a className="brand" href="/">
              <span className="mark" aria-hidden="true" />
              <span>
                <strong>Ayiti</strong>
                <small>Apertura de cuenta</small>
              </span>
            </a>
            <nav>
              <a href="/">Nueva solicitud</a>
              <a href="/verificaciones">Expedientes</a>
              <a href="/como-funciona">Como funciona</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer>
            Este sitio es un ejemplo de cliente. La verificacion la hace Idantite.
            Nuestro backend cruza el OCR del webhook con lo que el cliente escribio.
            {" "}
            <a href="/como-funciona">Como funciona</a>.
          </footer>
        </div>
      </body>
    </html>
  );
}
