import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recupera el acceso"
      title="Restablece tu contraseña"
      description="Te enviaremos un enlace seguro para elegir una nueva contraseña."
      footer={
        <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/login">
          Volver a iniciar sesión
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
