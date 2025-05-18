"use client";

import { Suspense } from "react";
import FailurePage from "@/components/FailurePage";

export default function Failure() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <FailurePage />
    </Suspense>
  );
}
