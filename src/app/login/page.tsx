import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyUser())) redirect("/setup");
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-white text-sm font-bold">
            C
          </span>
          <span className="text-lg font-semibold">Connector</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
