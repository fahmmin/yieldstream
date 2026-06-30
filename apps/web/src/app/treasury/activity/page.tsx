"use client";

import { DevLogPanel } from "@/components/DevLogPanel";
import { PageHeader } from "@/components/app/ui";

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        eyebrow="On-chain"
        title="Activity"
        description="Transaction flow logs, wallet events, and contract call traces from your session."
      />
      <DevLogPanel />
    </>
  );
}
