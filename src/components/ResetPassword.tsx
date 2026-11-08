"use client";

import { useActionState } from "react";
import { CopyButton } from "./client";
import type { ResetState } from "@/app/(admin)/admin/actions";

export function ResetPassword({ action }: { action: (prev: ResetState) => Promise<ResetState> }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="space-y-3">
      <button
        className="btn btn-sm"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("Set a new temporary password for this member? Their old password will stop working.")) e.preventDefault();
        }}
      >
        {pending ? "Resetting…" : "Reset password"}
      </button>
      {state?.password && (
        <div role="status" className="rounded-xl border border-good/40 bg-good/10 p-3 text-sm">
          <p className="font-semibold text-good">Temporary password (shown once)</p>
          <div className="mt-2 flex items-center gap-2"><code className="rounded bg-surface px-2 py-1 font-mono text-base">{state.password}</code><CopyButton text={state.password} /></div>
          <p className="mt-2 text-xs text-muted">Share it securely and ask the member to change it in Profile after logging in.</p>
        </div>
      )}
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
    </form>
  );
}
