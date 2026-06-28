"use client";

import { useActionState, useRef, useState } from "react";
import { ImageIcon, Plus, Save, Upload } from "lucide-react";
import {
  createProduct,
  updateProduct,
  type ProductActionState,
} from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/supabase/client";

type CategoryOption = {
  id: string;
  name: string;
};

type CreateProductFormProps = {
  workspaceId: string;
  workspaceSlug: string;
  categories: CategoryOption[];
  mode?: "create" | "edit";
  product?: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    category_id: string | null;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    min_stock_quantity: number | null;
    expiry_date: string | null;
  };
};

const initialProductActionState: ProductActionState = {
  message: "",
  success: false,
};

const PRODUCT_IMAGE_BUCKET = "product-images";

type UploadError = {
  message: string;
  statusCode?: string | number;
};

function getUploadErrorMessage(error: UploadError) {
  const message = error.message.toLowerCase();

  if (
    message.includes("bucket") ||
    message.includes("not found") ||
    error.statusCode === 404 ||
    error.statusCode === "404"
  ) {
    return "Product image bucket is not ready. Run supabase/storage-policies.sql in Supabase.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("policy") ||
    error.statusCode === 403 ||
    error.statusCode === "403"
  ) {
    return "Image upload is blocked by storage policies. Run supabase/storage-policies.sql in Supabase.";
  }

  return error.message;
}

export function CreateProductForm({
  workspaceId,
  workspaceSlug,
  categories,
  mode = "create",
  product,
}: CreateProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const productAction =
    mode === "edit" && product
      ? updateProduct.bind(null, workspaceId, workspaceSlug, product.id)
      : createProduct.bind(null, workspaceId, workspaceSlug);
  const [state, formAction, pending] = useActionState(
    productAction,
    initialProductActionState,
  );
  const isEditMode = mode === "edit";

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadMessage("Choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadMessage("Image must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const supabase = createClient();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${workspaceId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setUploadMessage(getUploadErrorMessage(error));
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    setImageUrl(data.publicUrl);
    setUploadMessage("Image uploaded successfully.");
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Classic cotton shirt"
            defaultValue={product?.name ?? ""}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="productImage">Product image</Label>
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <div className="flex flex-col gap-4 rounded-lg border border-[#D9D9D9] p-4 sm:flex-row sm:items-center">
            {imageUrl ? (
              <div
                className="h-24 w-24 rounded-md border bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
                aria-label="Product image preview"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-gray-50">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                id="productImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImageUpload(file);
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  {uploading
                    ? "Uploading..."
                    : imageUrl
                      ? "Replace image"
                      : "Upload image"}
                </Button>
                {imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setImageUrl("");
                      setUploadMessage("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              {uploadMessage ? (
                <p className="text-sm text-gray-500" aria-live="polite">
                  {uploadMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            className="flex h-12 w-full rounded-lg border border-[#D9D9D9] bg-white px-4 py-2 text-base text-[#0F172A] transition-all focus-visible:border-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            defaultValue={product?.category_id ?? ""}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newCategoryName">New category</Label>
          <Input
            id="newCategoryName"
            name="newCategoryName"
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.purchase_price ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling price</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.selling_price ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Opening stock</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock_quantity ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStockQuantity">Low stock alert</Label>
          <Input
            id="minStockQuantity"
            name="minStockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.min_stock_quantity ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            defaultValue={product?.expiry_date ?? ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            placeholder="Optional product notes"
            defaultValue={product?.description ?? ""}
          />
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm font-medium text-green-700"
              : "text-sm font-medium text-red-600"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {isEditMode ? (
          <Save className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {pending
          ? isEditMode
            ? "Saving..."
            : "Creating..."
          : isEditMode
            ? "Save changes"
            : "Create product"}
      </Button>
    </form>
  );
}
