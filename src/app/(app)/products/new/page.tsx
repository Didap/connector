import { NewProductForm } from "./NewProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuovo prodotto</h1>
      <NewProductForm />
    </div>
  );
}
