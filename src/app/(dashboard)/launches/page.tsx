"use client";

import { AllLaunches } from "@/components/AllLaunches";
import { FactoryBanner } from "@/components/FactoryBanner";

export default function LaunchesPage() {
  return (
    <div className="space-y-4">
      <FactoryBanner />
      <AllLaunches />
    </div>
  );
}
