"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/supabase/server";
import { createProductSchema } from "@/schemas/product";

export type ProductActionState = {
  message: string;
  success: boolean;
};

function getStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    // Remove /storage/v1/object/public/product-images/
    const pathParts = url.pathname.split("/").slice(4);
    return decodeURIComponent(pathParts.join("/"));
  } catch {
    return null;
  }
}
async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, error: "Unauthorized" };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return {
      supabase,
      user: null,
      error: "You do not have access to this workspace.",
    };
  }

  return { supabase, user, error: null };
}

export async function createProduct(
  workspaceId: string,
  workspaceSlug: string,
  data: import("@/schemas/product").CreateProductFormValues,
): Promise<ProductActionState> {
  void workspaceSlug;
  const parsed = createProductSchema.safeParse(data);

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the product details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const values = parsed.data;

  // Duplicate SKU check
  if (values.sku) {
    const { data: skuConflict } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("sku", values.sku)
      .maybeSingle();
    if (skuConflict) return { message: `SKU "${values.sku}" is already used by another product.`, success: false };
  }

  // Duplicate barcode check
  if (values.barcode) {
    const { data: barcodeConflict } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("barcode", values.barcode)
      .maybeSingle();
    if (barcodeConflict) return { message: `Barcode "${values.barcode}" is already used by another product.`, success: false };
  }

  let categoryId = values.categoryId;

  if (values.newCategoryName) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({
        workspace_id: workspaceId,
        name: values.newCategoryName,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (categoryError) {
      return { message: categoryError.message, success: false };
    }

    categoryId = category.id;
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      workspace_id: workspaceId,
      category_id: categoryId,
      name: values.name,
      sku: values.sku,
      barcode: values.barcode,
      description: values.description,
      image_url: values.imageUrl,
      purchase_price: values.purchasePrice,
      selling_price: values.sellingPrice,
      stock_quantity: values.stockQuantity,
      expiry_date: values.expiryDate,
      is_active: values.isActive,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (productError) {
    return { message: productError.message, success: false };
  }

  let inventoryHistoryWarning = "";

  if (values.stockQuantity > 0) {
    const admin = createAdminClient();
    const { error: transactionError } = await admin
      .from("inventory_transactions")
      .insert({
        workspace_id: workspaceId,
        product_id: product.id,
        transaction_type: "in",
        quantity: values.stockQuantity,
        previous_stock: 0,
        new_stock: values.stockQuantity,
        reference_type: "product_creation",
        notes: "Opening stock",
        created_by: user.id,
      });

    if (transactionError) {
      inventoryHistoryWarning =
        " Opening stock was saved on the product, but inventory history was not recorded.";
    }
  }

  revalidatePath("/products");
  revalidatePath("/");

  return {
    message: inventoryHistoryWarning
      ? `Product created.${inventoryHistoryWarning}`
      : "Product created successfully.",
    success: true,
  };
}

export async function updateProduct(
  workspaceId: string,
  workspaceSlug: string,
  productId: string,
  data: import("@/schemas/product").CreateProductFormValues,
): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse(data);

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the product details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const newImageUrl = data.imageUrl ?? null;
  const oldImageUrl = (data as { oldImageUrl?: string }).oldImageUrl ?? null;

  // Fetch existing product (including current image)
  const { data: existingProduct, error: existingProductError } = await supabase
    .from("products")
    .select("stock_quantity, image_url")
    .eq("id", productId)
    .eq("workspace_id", workspaceId)
    .single();

  if (existingProductError || !existingProduct) {
    return { message: "Product not found.", success: false };
  }

  const values = parsed.data;

  // Stock validation — prevent negative stock
  if (values.stockQuantity < 0) {
    return { message: "Stock quantity cannot be negative.", success: false };
  }

  // === IMAGE CLEANUP LOGIC ===
  if (oldImageUrl && oldImageUrl !== newImageUrl) {
    try {
      const oldPath = getStoragePath(oldImageUrl);
      if (oldPath) {
        const { error: deleteError } = await supabase.storage
          .from("product-images")
          .remove([oldPath]);

        if (deleteError) {
          console.error("Failed to delete old product image:", deleteError);
          // Non-blocking: we still proceed with the update
        }
      }
    } catch (err) {
      console.error("Error processing old image deletion:", err);
    }
  }

  // Duplicate SKU check (exclude self)
  if (values.sku) {
    const { data: skuConflict } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("sku", values.sku)
      .neq("id", productId)
      .maybeSingle();
    if (skuConflict) return { message: `SKU "${values.sku}" is already used by another product.`, success: false };
  }

  // Duplicate barcode check (exclude self)
  if (values.barcode) {
    const { data: barcodeConflict } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("barcode", values.barcode)
      .neq("id", productId)
      .maybeSingle();
    if (barcodeConflict) return { message: `Barcode "${values.barcode}" is already used by another product.`, success: false };
  }

  let categoryId = values.categoryId;

  if (values.newCategoryName) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({
        workspace_id: workspaceId,
        name: values.newCategoryName,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (categoryError) {
      return { message: categoryError.message, success: false };
    }

    categoryId = category.id;
  }

  const { error: productError } = await supabase
    .from("products")
    .update({
      category_id: categoryId ?? null,
      name: values.name,
      sku: values.sku,
      barcode: values.barcode ?? null,
      description: values.description,
      image_url: values.imageUrl || null,
      purchase_price: values.purchasePrice,
      selling_price: values.sellingPrice,
      stock_quantity: values.stockQuantity,
      expiry_date: values.expiryDate,
      is_active: values.isActive,
      updated_by: user.id,
    })
    .eq("id", productId)
    .eq("workspace_id", workspaceId);

  if (productError) {
    return { message: productError.message, success: false };
  }

  // ... rest of your inventory logic (unchanged)
  let inventoryHistoryWarning = "";

  if (existingProduct.stock_quantity !== values.stockQuantity) {
    const quantityDelta = values.stockQuantity - existingProduct.stock_quantity;
    const admin = createAdminClient();
    const { error: transactionError } = await admin
      .from("inventory_transactions")
      .insert({
        workspace_id: workspaceId,
        product_id: productId,
        transaction_type: "adjustment",
        quantity: quantityDelta,
        previous_stock: existingProduct.stock_quantity,
        new_stock: values.stockQuantity,
        reference_type: "product_update",
        notes: "Stock updated from product edit",
        created_by: user.id,
      });

    if (transactionError) {
      inventoryHistoryWarning =
        " Product was updated, but inventory history was not recorded.";
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
  revalidatePath("/");

  return {
    message: inventoryHistoryWarning
      ? `Product updated.${inventoryHistoryWarning}`
      : "Product updated successfully.",
    success: true,
  };
}

export async function deleteProduct(
  workspaceId: string,
  productId: string,
): Promise<ProductActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const { data: existingProduct, error: fetchError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", productId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (fetchError || !existingProduct) {
    return { message: "Product not found or you don't have permission to delete it.", success: false };
  }

  const admin = createAdminClient();
  const { count: saleCount } = await admin
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (saleCount && saleCount > 0) {
    return {
      message: "This product cannot be deleted because it is used in sales records.",
      success: false,
    };
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("workspace_id", workspaceId);

  if (productError) {
    return { message: productError.message, success: false };
  }

  if (existingProduct.image_url) {
    const imagePath = getStoragePath(existingProduct.image_url);
    if (imagePath) {
      await supabase.storage.from("product-images").remove([imagePath]);
    }
  }

  revalidatePath("/products");
  revalidatePath("/");

  return { message: "Product deleted successfully", success: true };
}
