"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus, Save, Upload } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  const msg = error.message.toLowerCase();
  if (
    msg.includes("bucket") ||
    msg.includes("not found") ||
    error.statusCode === 404 ||
    error.statusCode === "404"
  )
    return "Product image bucket is not ready. Run supabase/storage-policies.sql in Supabase.";
  if (
    msg.includes("row-level security") ||
    msg.includes("policy") ||
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
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const { success, error } = useToast();
  const isEditMode = mode === "edit";

  const form = useForm<CreateProductFormValues>({
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
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${workspaceId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
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
    form.setValue("imageUrl", data.publicUrl);
    setUploadMessage("Image uploaded successfully.");
    setUploading(false);
  }

  const onSubmit = async (data: CreateProductFormValues) => {
    const result =
      isEditMode && product
        ? await updateProduct(workspaceId, workspaceSlug, product.id, data)
        : await createProduct(workspaceId, workspaceSlug, data);
    if (result.success) {
      success(result.message);
      router.push("/products");
    } else error(result.message);
  };

  const imageUrl = form.watch("imageUrl");

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Classic cotton shirt"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SHIRT-001"
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image upload — managed via form.setValue */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product image</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
                        {imageUrl ? (
                          <div
                            className="h-24 w-24 rounded-md border border-border bg-cover bg-center"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-md border border-border bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleImageUpload(f);
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
                            {imageUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  form.setValue("imageUrl", undefined);
                                  setUploadMessage("");
                                  if (fileInputRef.current)
                                    fileInputRef.current.value = "";
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          {uploadMessage && (
                            <p
                              className="text-sm text-muted-foreground"
                              aria-live="polite"
                            >
                              {uploadMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Or type a new one"
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening stock *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional product notes"
                        {...field}
                        value={field.value || ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-input"
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEditMode ? (
                <Save className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {form.formState.isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create product"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
