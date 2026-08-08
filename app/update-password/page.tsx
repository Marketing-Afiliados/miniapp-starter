import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/forms";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      eyebrow="Último paso"
      title="Crea una nueva contraseña"
      description="Elige una contraseña segura que no uses en otros servicios."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
