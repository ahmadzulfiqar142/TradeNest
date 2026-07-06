"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus, Save, Upload } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "@/schemas/product";

type CategoryOption = { id: string; name: string };

type CreateProductFormProps = {
  workspaceId: string;
  workspaceSlug: string;
  categories: CategoryOption[];
  mode?: "create" | "edit";
  product?: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    description: string | null;
    image_url: string | null;
    category_id: string | null;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    expiry_date: string | null;
    is_active: boolean | null;
  };
};

const PRODUCT_IMAGE_BUCKET = "product-images";

type UploadError = { message: string; statusCode?: string | number };

function getUploadErrorMessage(error: UploadError) {
  const message = error.message.toLowerCase();
  if (
    message.includes("bucket") ||
    message.includes("not found") ||
    error.statusCode === 404 ||
    error.statusCode === "404"
  )
    return "Product image bucket is not ready. Run supabase/storage-policies.sql in Supabase.";
  if (
    message.includes("row-level security") ||
    message.includes("policy") ||
    error.statusCode === 403 ||
    error.statusCode === "403"
  )
    return "Image upload is blocked by storage policies. Run supabase/storage-policies.sql in Supabase.";
  return error.message;
}

export function CreateProductForm({
  workspaceId,
  workspaceSlug,
  categories,
  mode = "create",
  product,
}: CreateProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? undefined,
      barcode: product?.barcode ?? undefined,
      description: product?.description ?? undefined,
      imageUrl: product?.image_url ?? undefined,
      categoryId: product?.category_id ?? undefined,
      newCategoryName: undefined,
      purchasePrice: product?.purchase_price ?? 0,
      sellingPrice: product?.selling_price ?? 0,
      stockQuantity: product?.stock_quantity ?? 0,
      expiryDate: product?.expiry_date ?? undefined,
      isActive: product?.is_active ?? true,
    },
  });

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
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      setUploadMessage(getUploadErrorMessage(uploadError));
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

  const onSubmit = (data: CreateProductFormValues) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.sku) formData.append("sku", data.sku);
    if (data.barcode) formData.append("barcode", data.barcode);
    if (data.description) formData.append("description", data.description);
    if (imageUrl) formData.append("imageUrl", imageUrl);
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    if (data.newCategoryName)
      formData.append("newCategoryName", data.newCategoryName);
    formData.append("purchasePrice", data.purchasePrice.toString());
    formData.append("sellingPrice", data.sellingPrice.toString());
    formData.append("stockQuantity", data.stockQuantity.toString());
    if (data.expiryDate) formData.append("expiryDate", data.expiryDate);
    formData.append("isActive", data.isActive.toString());

    startTransition(async () => {
      const result = isEditMode && product
        ? await updateProduct(workspaceId, workspaceSlug, product.id, { message: "", success: false }, formData)
        : await createProduct(workspaceId, workspaceSlug, { message: "", success: false }, formData);

      if (result.success) {
        success(result.message);
        router.push("/products");
      } else {
        error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-gray-300">
                Product name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Classic cotton shirt"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.name ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-gray-300">
                SKU
              </Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="SHIRT-001"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.sku ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.sku && (
                <p className="text-xs text-red-400">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-gray-300">
                Barcode
              </Label>
              <Input
                id="barcode"
                {...register("barcode")}
                placeholder="Optional"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.barcode ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.barcode && (
                <p className="text-xs text-red-400">{errors.barcode.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="productImage" className="text-gray-300">
                Product image
              </Label>
              <div className="flex flex-col gap-4 rounded-lg border border-gray-600 p-4 sm:flex-row sm:items-center bg-gray-700">
                {imageUrl ? (
                  <div
                    className="h-24 w-24 rounded-md border border-gray-600 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                    aria-label="Product image preview"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-gray-600 bg-gray-800">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImageUpload(file);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
                    </Button>
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setImageUrl("");
                          setUploadMessage("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-gray-300 hover:bg-gray-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {uploadMessage && (
                    <p className="text-sm text-gray-400" aria-live="polite">
                      {uploadMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-gray-300">
                Category
              </Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className={`flex h-12 w-full rounded-lg border bg-gray-700 px-4 py-2 text-base text-gray-100 transition-all focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  errors.categoryId ? "border-red-500" : "border-gray-600"
                }`}
                disabled={pending}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-gray-700">
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-red-400">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newCategoryName" className="text-gray-300">
                New category
              </Label>
              <Input
                id="newCategoryName"
                {...register("newCategoryName")}
                placeholder="Optional"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.newCategoryName ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.newCategoryName && (
                <p className="text-xs text-red-400">{errors.newCategoryName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="text-gray-300">
                Purchase price *
              </Label>
              <Input
                id="purchasePrice"
                type="number"
                {...register("purchasePrice", { valueAsNumber: true })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.purchasePrice ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.purchasePrice && (
                <p className="text-xs text-red-400">{errors.purchasePrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-gray-300">
                Selling price *
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                {...register("sellingPrice", { valueAsNumber: true })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.sellingPrice ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-red-400">{errors.sellingPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity" className="text-gray-300">
                Opening stock *
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                {...register("stockQuantity", { valueAsNumber: true })}
                min="0"
                step="1"
                placeholder="0"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.stockQuantity ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.stockQuantity && (
                <p className="text-xs text-red-400">{errors.stockQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-gray-300">
                Expiry date
              </Label>
              <Input
                id="expiryDate"
                type="date"
                {...register("expiryDate")}
                className={`bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-600 ${
                  errors.expiryDate ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.expiryDate && (
                <p className="text-xs text-red-400">{errors.expiryDate.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-gray-300">
                Description
              </Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Optional product notes"
                className={`bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600 ${
                  errors.description ? "border-red-500" : ""
                }`}
                disabled={pending}
              />
              {errors.description && (
                <p className="text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2 flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                disabled={pending}
              />
              <Label htmlFor="isActive" className="text-gray-300 cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEditMode ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {pending
              ? isEditMode ? "Saving..." : "Creating..."
              : isEditMode ? "Save changes" : "Create product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
