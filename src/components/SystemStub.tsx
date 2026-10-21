import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { InDev, Page, btnPrimary } from "@/components/slams";

export function SystemStub({ title, purpose, action, children }: { title: string; purpose: string; action: { to: "/scene" | "/passport" | "/stuck" | "/conservatory"; label: string }; children?: ReactNode }) {
  return (
    <Page title={title} eyebrow="Studio system">
      <p>{purpose}</p>
      <p className="mt-3"><InDev /></p>
      {children}
      <Link to={action.to} className={`${btnPrimary} mt-6`}>{action.label}</Link>
    </Page>
  );
}
