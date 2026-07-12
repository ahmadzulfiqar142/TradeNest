"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/supabase/server";
import { createProductSchema, type CreateProductFormValues } from "@/schemas/product";

export type ProductActionState = { message: string; success: boolean };

function getStoragePath(publicUrl: string | null) {
  if (!publicUrl) return null;
  try {
    const parts = new URL(publicUrl).pathname.split("/");
    const bucketIndex = parts.indexOf("product-images");
    return bucketIndex === -1 ? null : decodeURIComponent(parts.slice(bucketIndex + 1).join("/"));
  } catch { return null; }
}

async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, error: "Unauthorized" };
  const admin = createAdminClient();
  const { data: member } = await admin.from("workspace_members").select("id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  return member ? { supabase, user, error: null } : { supabase, user: null, error: "You do not have access to this workspace." };
}

async function resolveCategory(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string, values: CreateProductFormValues) {
  if (!values.newCategoryName) return values.categoryId ?? null;
  const { data, error } = await supabase.from("categories").insert({ workspace_id: workspaceId, name: values.newCategoryName, created_by: userId, updated_by: userId }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function replaceProductUnits(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, values: CreateProductFormValues) {
  const { data: currentUnits, error: currentError } = await supabase.from("product_units").select("id").eq("product_id", productId);
  if (currentError) throw new Error(currentError.message);
  if (currentUnits?.length) {
    const { error } = await supabase.from("product_units").delete().eq("product_id", productId);
    if (error) throw new Error(error.message);
  }
  const { data: units, error: unitsError } = await supabase.from("product_units").insert(values.units.map((unit) => ({ product_id: productId, unit_id: unit.unitId, conversion_factor: unit.conversionFactor, is_default: unit.isDefault }))).select("id, unit_id");
  if (unitsError || !units) throw new Error(unitsError?.message ?? "Could not save product units");
  const prices = values.units.map((unit) => {
    const productUnit = units.find((saved) => saved.unit_id === unit.unitId);
    return { product_unit_id: productUnit!.id, selling_price: unit.sellingPrice, purchase_price: unit.purchasePrice };
  });
  const { error: pricesError } = await supabase.from("product_prices").insert(prices);
  if (pricesError) throw new Error(pricesError.message);
}

function legacyDefaultPrices(values: CreateProductFormValues) {
  const unit = values.units.find((item) => item.isDefault)!;
  return { purchase_price: unit.purchasePrice, selling_price: unit.sellingPrice };
}

export async function createProduct(workspaceId: string, _workspaceSlug: string, data: CreateProductFormValues): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse(data);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Check the product details and try again.", success: false };
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };
  const values = parsed.data;
  try {
    if (values.sku && (await supabase.from("products").select("id").eq("workspace_id", workspaceId).eq("sku", values.sku).maybeSingle()).data) return { message: `SKU "${values.sku}" is already used by another product.`, success: false };
    if (values.barcode && (await supabase.from("products").select("id").eq("workspace_id", workspaceId).eq("barcode", values.barcode).maybeSingle()).data) return { message: `Barcode "${values.barcode}" is already used by another product.`, success: false };
    const categoryId = await resolveCategory(supabase, workspaceId, user.id, values);
    const { data: product, error: productError } = await supabase.from("products").insert({ workspace_id: workspaceId, category_id: categoryId, name: values.name, sku: values.sku ?? null, barcode: values.barcode ?? null, description: values.description ?? null, image_url: values.imageUrl ?? null, is_active: values.isActive, created_by: user.id, updated_by: user.id, ...legacyDefaultPrices(values) }).select("id").single();
    if (productError) return { message: productError.message, success: false };
    await replaceProductUnits(supabase, product.id, values);
  } catch (cause) { return { message: cause instanceof Error ? cause.message : "Could not create product.", success: false }; }
  revalidatePath("/products"); revalidatePath("/");
  return { message: "Product created successfully.", success: true };
}

export async function updateProduct(workspaceId: string, _workspaceSlug: string, productId: string, data: CreateProductFormValues): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse(data);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Check the product details and try again.", success: false };
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };
  const values = parsed.data;
  const { data: existing } = await supabase.from("products").select("image_url").eq("id", productId).eq("workspace_id", workspaceId).maybeSingle();
  if (!existing) return { message: "Product not found.", success: false };
  try {
    if (values.sku && (await supabase.from("products").select("id").eq("workspace_id", workspaceId).eq("sku", values.sku).neq("id", productId).maybeSingle()).data) return { message: `SKU "${values.sku}" is already used by another product.`, success: false };
    if (values.barcode && (await supabase.from("products").select("id").eq("workspace_id", workspaceId).eq("barcode", values.barcode).neq("id", productId).maybeSingle()).data) return { message: `Barcode "${values.barcode}" is already used by another product.`, success: false };
    const categoryId = await resolveCategory(supabase, workspaceId, user.id, values);
    const { error: updateError } = await supabase.from("products").update({ category_id: categoryId, name: values.name, sku: values.sku ?? null, barcode: values.barcode ?? null, description: values.description ?? null, image_url: values.imageUrl ?? null, is_active: values.isActive, updated_by: user.id, ...legacyDefaultPrices(values) }).eq("id", productId).eq("workspace_id", workspaceId);
    if (updateError) return { message: updateError.message, success: false };
    await replaceProductUnits(supabase, productId, values);
  } catch (cause) { return { message: cause instanceof Error ? cause.message : "Could not update product.", success: false }; }
  if (existing.image_url && existing.image_url !== values.imageUrl) {
    const path = getStoragePath(existing.image_url); if (path) await supabase.storage.from("product-images").remove([path]);
  }
  revalidatePath("/products"); revalidatePath(`/products/${productId}/edit`); revalidatePath("/");
  return { message: "Product updated successfully.", success: true };
}

export async function deleteProduct(workspaceId: string, productId: string): Promise<ProductActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };
  const { data: product } = await supabase.from("products").select("image_url").eq("id", productId).eq("workspace_id", workspaceId).maybeSingle();
  if (!product) return { message: "Product not found or you don't have permission to delete it.", success: false };
  const admin = createAdminClient(); const { count: saleCount } = await admin.from("sale_items").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if (saleCount) return { message: "This product cannot be deleted because it is used in sales records.", success: false };
  const { error: deleteError } = await supabase.from("products").delete().eq("id", productId).eq("workspace_id", workspaceId);
  if (deleteError) return { message: deleteError.message, success: false };
  const path = getStoragePath(product.image_url); if (path) await supabase.storage.from("product-images").remove([path]);
  revalidatePath("/products"); revalidatePath("/"); return { message: "Product deleted successfully", success: true };
}
