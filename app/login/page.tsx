import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";
import { getOptionalUser } from "@/lib/auth/guards";

interface LoginPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getOptionalUser()) redirect("/dashboard");
  const { message } = await searchParams;

  return (
    <AuthShell
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión"
      description="Accede a tu panel y continúa donde lo dejaste."
      message={message}
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/register">
            Créala gratis
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
