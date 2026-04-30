import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUser } from "@/lib/auth/session";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAnyUser())) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}
