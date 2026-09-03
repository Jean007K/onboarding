import "./globals.css";
import { I18nProvider } from "./components/I18nProvider";
import Shell from "./components/Shell";

export const metadata = {
  title: "Onboarding — account opening",
  description: "Customer onboarding demo using Emverax for identity verification",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
