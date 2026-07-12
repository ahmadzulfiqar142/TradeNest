"use client";

import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ImageIcon, Plus, Save, Trash2, Upload } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createClient } from "@/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createProductSchema, type CreateProductFormValues } from "@/schemas/product";

type CategoryOption = { id: string; name: string };
type UnitOption = { id: string; name: string; symbol: string };
type ProductUnitValue = CreateProductFormValues["units"][number];
type Props = { workspaceId: string; workspaceSlug: string; categories: CategoryOption[]; units: UnitOption[]; mode?: "create" | "edit"; product?: { id: string; name: string; sku: string | null; barcode: string | null; description: string | null; image_url: string | null; category_id: string | null; is_active: boolean | null; units: ProductUnitValue[] } };
const BUCKET = "product-images";

export function CreateProductForm({ workspaceId, workspaceSlug, categories, units, mode = "create", product }: Props) {
  const router = useRouter(); const fileInputRef = useRef<HTMLInputElement>(null); const [uploading, setUploading] = useState(false); const [uploadMessage, setUploadMessage] = useState(""); const { success, error } = useToast();
  const form = useForm<CreateProductFormValues>({ resolver: zodResolver(createProductSchema), defaultValues: { name: product?.name ?? "", sku: product?.sku ?? undefined, barcode: product?.barcode ?? undefined, description: product?.description ?? undefined, imageUrl: product?.image_url ?? undefined, categoryId: product?.category_id ?? undefined, newCategoryName: undefined, units: product?.units ?? [{ unitId: units[0]?.id ?? "", conversionFactor: 1, isDefault: true, sellingPrice: 0, purchasePrice: 0 }], isActive: product?.is_active ?? true } });
  const fields = useFieldArray({ control: form.control, name: "units" });
  const imageUrl = form.watch("imageUrl"); const submitting = form.formState.isSubmitting;
  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return setUploadMessage("Choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setUploadMessage("Image must be 2MB or smaller.");
    setUploading(true); setUploadMessage(""); const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"; const path = `${workspaceId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const supabase = createClient(); const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) { setUploadMessage(uploadError.message); setUploading(false); return; }
    form.setValue("imageUrl", supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl); setUploadMessage("Image uploaded successfully."); setUploading(false);
  }
  async function onSubmit(values: CreateProductFormValues) {
    const result = mode === "edit" && product ? await updateProduct(workspaceId, workspaceSlug, product.id, values) : await createProduct(workspaceId, workspaceSlug, values);
    result.success ? (success(result.message), router.push("/products")) : error(result.message);
  }
  return <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
    <section className="grid gap-4 md:grid-cols-2"><h2 className="md:col-span-2 text-lg font-semibold">Basic information</h2>
      <FormField control={form.control} name="name" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Product name *</FormLabel><FormControl><Input {...field} disabled={submitting} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="sku" render={({ field }) => <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="SHIRT-001" disabled={submitting} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="barcode" render={({ field }) => <FormItem><FormLabel>Barcode</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={submitting} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="categoryId" render={({ field }) => <FormItem><FormLabel>Category</FormLabel><FormControl><select {...field} value={field.value || ""} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Uncategorized</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="newCategoryName" render={({ field }) => <FormItem><FormLabel>New category</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Or type a new one" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="description" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Optional product notes" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="imageUrl" render={() => <FormItem className="md:col-span-2"><FormLabel>Product image</FormLabel><FormControl><div className="flex gap-4 rounded-lg border p-4">{imageUrl ? <div className="h-16 w-16 rounded bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} /> : <ImageIcon className="h-12 w-12 text-muted-foreground" />}<div><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && void upload(e.target.files[0])}/><Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload image"}</Button>{imageUrl && <Button type="button" variant="ghost" onClick={() => form.setValue("imageUrl", undefined)}>Remove</Button>}<p className="text-sm text-muted-foreground">{uploadMessage}</p></div></div></FormControl><FormMessage /></FormItem>} />
    </section>
    <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Units and pricing</h2><p className="text-sm text-muted-foreground">Set a conversion and price for every selling unit.</p></div><Button type="button" variant="outline" onClick={() => fields.append({ unitId: "", conversionFactor: 1, isDefault: fields.fields.length === 0, sellingPrice: 0, purchasePrice: 0 })}><Plus className="h-4 w-4" />Add unit</Button></div><div className="space-y-3">{fields.fields.map((item, index) => <div key={item.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1.3fr_repeat(3,1fr)_auto]"><FormField control={form.control} name={`units.${index}.unitId`} render={({ field }) => <FormItem><FormLabel className="md:hidden">Unit</FormLabel><FormControl><select {...field} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select unit</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>)}</select></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`units.${index}.conversionFactor`} render={({ field }) => <FormItem><FormLabel className="md:hidden">Conversion</FormLabel><FormControl><Input type="number" min="0.000001" step="any" value={field.value} onChange={e => field.onChange(e.target.valueAsNumber)} placeholder="Conversion" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`units.${index}.sellingPrice`} render={({ field }) => <FormItem><FormLabel className="md:hidden">Selling</FormLabel><FormControl><Input type="number" min="0" step="0.01" value={field.value} onChange={e => field.onChange(e.target.valueAsNumber)} placeholder="Selling price" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`units.${index}.purchasePrice`} render={({ field }) => <FormItem><FormLabel className="md:hidden">Purchase</FormLabel><FormControl><Input type="number" min="0" step="0.01" value={field.value} onChange={e => field.onChange(e.target.valueAsNumber)} placeholder="Purchase price" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name={`units.${index}.isDefault`} render={({ field }) => <FormItem className="flex items-center gap-2 pt-2"><FormControl><input type="radio" checked={field.value} onChange={() => fields.fields.forEach((_, i) => form.setValue(`units.${i}.isDefault`, i === index))} /></FormControl><FormLabel>Default</FormLabel><Button type="button" size="icon" variant="ghost" onClick={() => fields.remove(index)} disabled={fields.fields.length === 1}><Trash2 className="h-4 w-4" /></Button></FormItem>} /></div>)}</div><FormMessage>{form.formState.errors.units?.message}</FormMessage></section>
    <FormField control={form.control} name="isActive" render={({ field }) => <FormItem className="flex items-center gap-3 space-y-0"><FormControl><input type="checkbox" checked={field.value} onChange={field.onChange}/></FormControl><FormLabel>Active</FormLabel></FormItem>} />
    <Button type="submit" disabled={submitting || uploading}>{mode === "edit" ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create product"}</Button>
  </form></Form>;
}
