import { Suspense } from "react";
import SuccessPage from "@/components/SuccesPage";

export default function SuccessWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <SuccessPage />
    </Suspense>
  );
}
