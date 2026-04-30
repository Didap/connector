"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function SetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("password ≥ 8 chars");
    if (password !== confirm) return setErr("passwords do not match");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "setup failed");
        return;
      }
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <p className="text-xs text-[var(--color-fg-muted)] mb-4">
        First-time setup. Create the admin account — only one allowed.
      </p>
      <form className="space-y-4" onSubmit={submit}>
        <FormRow>
          <Label htmlFor="u">Username</Label>
          <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </FormRow>
        <FormRow>
          <Label htmlFor="p" hint="≥ 8 chars">Password</Label>
          <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormRow>
        <FormRow>
          <Label htmlFor="c">Confirm</Label>
          <Input id="c" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </FormRow>
        {err && <p className="text-xs text-[var(--color-danger)]">{err}</p>}
        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? "..." : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
