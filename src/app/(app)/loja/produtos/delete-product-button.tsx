"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "./actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProduct}
      className="flex-1 sm:flex-none"
      onSubmit={(e) => {
        if (!confirm("Excluir este anúncio? Essa ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <Button type="submit" variant="destructive" size="sm" className="w-full">
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </form>
  );
}
