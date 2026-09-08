import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/forms";
import { getOptionalUser } from "@/lib/auth/guards";

export default async function RegisterPage() {
  if (await getOptionalUser()) redirect("/dashboard");

  return (
    <AuthShell
      eyebrow="Empieza hoy"
      title="Crea tu cuenta"
      description="Usa el correo de tu compra y confírmalo para vincular tu acceso. Crear una cuenta no confirma un pago."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/login">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
