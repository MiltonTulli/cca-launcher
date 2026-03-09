"use client";

import { use } from "react";
import { DraftView } from "@/components/DraftView";

export default function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <DraftView id={id} />;
}
