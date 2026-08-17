"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import {
  BUSINESS_LOGO_BUCKET,
  createBusinessLogoPath,
  getBusinessLogoStoragePath,
  validateBusinessLogo,
} from "@/lib/decoquote/logo";
import { toCents } from "@/lib/decoquote/money";
import {
  businessProfileSchema,
  catalogOverrideIdSchema,
  catalogOverrideSchema,
  customerSchema,
  formValue,
  materialSchema,
  serviceSchema,
  zodFieldErrors,
} from "@/lib/decoquote/validation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/action-state";

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveBusinessProfileAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireUser();
  const result = businessProfileSchema.safeParse({
    businessName: formValue(formData, "businessName"),
    ownerName: formValue(formData, "ownerName"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    whatsapp: formValue(formData, "whatsapp"),
    instagram: formValue(formData, "instagram"),
    address: formValue(formData, "address"),
    countryCode: formValue(formData, "countryCode") || "OTHER",
    currency: formValue(formData, "currency") || "USD",
    defaultMarginPercentage: formValue(formData, "defaultMarginPercentage"),
    defaultTerms: formValue(formData, "defaultTerms"),
  });
  if (!result.success) {
    return { status: "error", message: "Revisa los campos indicados.", fieldErrors: zodFieldErrors(result.error) };
  }
  const logo = await validateBusinessLogo(formData.get("logoFile"));
  if (logo.error) {
    return { status: "error", message: "No pudimos procesar el logo.", fieldErrors: { logoFile: logo.error } };
  }

  const data = result.data;
  const supabase = await createClient();
  const { data: existingProfile } = await supabase
    .from("business_profiles")
    .select("logo_url")
    .eq("user_id", user.id)
    .maybeSingle();
  const previousLogoUrl = existingProfile?.logo_url ?? null;
  let logoUrl = checked(formData, "removeLogo") ? null : previousLogoUrl;
  let uploadedLogoPath: string | null = null;

  if (logo.file && logo.extension) {
    uploadedLogoPath = createBusinessLogoPath(user.id, logo.extension);
    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_LOGO_BUCKET)
      .upload(uploadedLogoPath, logo.file, {
        cacheControl: "3600",
        contentType: logo.file.type,
        upsert: false,
      });
    if (uploadError) {
      return { status: "error", message: "No pudimos subir el logo. Verifica la migración de Storage e inténtalo nuevamente." };
    }
    logoUrl = supabase.storage.from(BUSINESS_LOGO_BUCKET).getPublicUrl(uploadedLogoPath).data.publicUrl;
  }

  const { error } = await supabase.from("business_profiles").upsert(
    {
      user_id: user.id,
      business_name: data.businessName,
      owner_name: data.ownerName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      logo_url: logoUrl,
      address: data.address,
      country_code: data.countryCode,
      currency: data.currency,
      default_margin_percentage: data.defaultMarginPercentage,
      default_terms: data.defaultTerms,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    if (uploadedLogoPath) await supabase.storage.from(BUSINESS_LOGO_BUCKET).remove([uploadedLogoPath]);
    return { status: "error", message: "No pudimos guardar el perfil del negocio." };
  }

  const categoryIds = formData.getAll("businessCategoryIds")
    .filter((value): value is string => typeof value === "string");
  const { error: categoryError } = await supabase.rpc("set_business_catalog_categories", {
    p_category_ids: categoryIds,
  });
  if (categoryError) {
    return { status: "error", message: "El perfil se guardó, pero no pudimos actualizar tus rubros." };
  }

  const previousLogoPath = getBusinessLogoStoragePath(previousLogoUrl);
  if (previousLogoPath && previousLogoPath !== uploadedLogoPath && (uploadedLogoPath || checked(formData, "removeLogo"))) {
    await supabase.storage.from(BUSINESS_LOGO_BUCKET).remove([previousLogoPath]);
  }

  revalidatePath("/dashboard", "layout");
  if (formValue(formData, "intent") === "onboarding") {
    redirect("/dashboard/quotes/new?welcome=1");
  }
  return { status: "success", message: "Perfil de negocio actualizado." };
}

export async function saveCustomerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireUser();
  const result = customerSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    fullName: formValue(formData, "fullName"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    whatsapp: formValue(formData, "whatsapp"),
    notes: formValue(formData, "notes"),
  });
  if (!result.success) return { status: "error", message: "Revisa los campos indicados.", fieldErrors: zodFieldErrors(result.error) };
  const { id, ...data } = result.data;
  const supabase = await createClient();
  const payload = {
    user_id: user.id,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    notes: data.notes,
    deleted_at: null,
  };
  const query = id
    ? supabase.from("customers").update(payload).eq("id", id).eq("user_id", user.id)
    : supabase.from("customers").insert(payload);
  const { error } = await query;
  if (error) return { status: "error", message: "No pudimos guardar el cliente." };
  revalidatePath("/dashboard/customers");
  return { status: "success", message: id ? "Cliente actualizado." : "Cliente creado." };
}

export async function archiveCustomerAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const id = formValue(formData, "id");
  const supabase = await createClient();
  await supabase.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/customers");
}

export async function saveServiceAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireUser();
  const result = serviceSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    defaultCost: formValue(formData, "defaultCost"),
    defaultPrice: formValue(formData, "defaultPrice"),
    itemType: formValue(formData, "itemType") || "service",
    unit: formValue(formData, "unit") || "servicio",
    categoryId: formValue(formData, "categoryId") || null,
    subcategoryId: formValue(formData, "subcategoryId") || null,
    active: checked(formData, "active"),
  });
  if (!result.success) return { status: "error", message: "Revisa los campos indicados.", fieldErrors: zodFieldErrors(result.error) };
  const { id, ...data } = result.data;
  const supabase = await createClient();
  if (data.subcategoryId) {
    const { data: subcategory } = await supabase
      .from("catalog_subcategories")
      .select("id")
      .eq("id", data.subcategoryId)
      .eq("category_id", data.categoryId ?? "")
      .maybeSingle();
    if (!subcategory) return { status: "error", message: "La subcategoría no pertenece a la categoría seleccionada." };
  }
  const payload = {
    user_id: user.id,
    name: data.name,
    description: data.description,
    default_cost_cents: toCents(data.defaultCost),
    default_price_cents: toCents(data.defaultPrice),
    item_type: data.itemType,
    unit: data.unit,
    category_id: data.categoryId,
    subcategory_id: data.subcategoryId,
    active: data.active,
  };
  const query = id
    ? supabase.from("services").update(payload).eq("id", id).eq("user_id", user.id)
    : supabase.from("services").insert(payload);
  const { error } = await query;
  if (error) return { status: "error", message: "No pudimos guardar el servicio." };
  revalidatePath("/dashboard/services");
  return { status: "success", message: id ? "Servicio actualizado." : "Servicio creado." };
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("services").update({ active: formValue(formData, "active") === "true" }).eq("id", formValue(formData, "id")).eq("user_id", user.id);
  revalidatePath("/dashboard/services");
}

export async function saveMaterialAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireUser();
  const result = materialSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    unit: formValue(formData, "unit"),
    unitCost: formValue(formData, "unitCost"),
    defaultPrice: formValue(formData, "defaultPrice"),
    categoryId: formValue(formData, "categoryId") || null,
    subcategoryId: formValue(formData, "subcategoryId") || null,
    active: checked(formData, "active"),
  });
  if (!result.success) return { status: "error", message: "Revisa los campos indicados.", fieldErrors: zodFieldErrors(result.error) };
  const { id, ...data } = result.data;
  const supabase = await createClient();
  if (data.subcategoryId) {
    const { data: subcategory } = await supabase
      .from("catalog_subcategories")
      .select("id")
      .eq("id", data.subcategoryId)
      .eq("category_id", data.categoryId ?? "")
      .maybeSingle();
    if (!subcategory) return { status: "error", message: "La subcategoría no pertenece a la categoría seleccionada." };
  }
  const payload = {
    user_id: user.id,
    name: data.name,
    description: data.description,
    unit: data.unit,
    unit_cost_cents: toCents(data.unitCost),
    default_price_cents: toCents(data.defaultPrice),
    category_id: data.categoryId,
    subcategory_id: data.subcategoryId,
    active: data.active,
  };
  const query = id
    ? supabase.from("materials").update(payload).eq("id", id).eq("user_id", user.id)
    : supabase.from("materials").insert(payload);
  const { error } = await query;
  if (error) return { status: "error", message: "No pudimos guardar el material." };
  revalidatePath("/dashboard/materials");
  return { status: "success", message: id ? "Material actualizado." : "Material creado." };
}

export async function saveCatalogOverrideAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireUser();
  const result = catalogOverrideSchema.safeParse({
    catalogItemId: formValue(formData, "catalogItemId"),
    unit: formValue(formData, "unit"),
    defaultCost: formValue(formData, "defaultCost"),
    defaultPrice: formValue(formData, "defaultPrice"),
    hidden: checked(formData, "hidden"),
  });
  if (!result.success) {
    return { status: "error", message: "Revisa los valores del catálogo.", fieldErrors: zodFieldErrors(result.error) };
  }
  const data = result.data;
  const supabase = await createClient();
  const { data: globalItem } = await supabase
    .from("catalog_items")
    .select("id")
    .eq("id", data.catalogItemId)
    .eq("active", true)
    .maybeSingle();
  if (!globalItem) return { status: "error", message: "El elemento global ya no está disponible." };
  const { error } = await supabase.from("catalog_item_overrides").upsert({
    user_id: user.id,
    catalog_item_id: data.catalogItemId,
    unit: data.unit,
    default_cost_cents: toCents(data.defaultCost),
    default_price_cents: toCents(data.defaultPrice),
    hidden: data.hidden,
  }, { onConflict: "user_id,catalog_item_id" });
  if (error) return { status: "error", message: "No pudimos guardar tu personalización." };
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/materials");
  revalidatePath("/dashboard/quotes/new");
  return { status: "success", message: data.hidden ? "Elemento ocultado." : "Valores personalizados." };
}

export async function resetCatalogOverrideAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const result = catalogOverrideIdSchema.safeParse({
    catalogItemId: formValue(formData, "id"),
  });
  if (!result.success) return;
  const supabase = await createClient();
  await supabase
    .from("catalog_item_overrides")
    .delete()
    .eq("catalog_item_id", result.data.catalogItemId)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/materials");
  revalidatePath("/dashboard/quotes/new");
}

export async function toggleMaterialAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("materials").update({ active: formValue(formData, "active") === "true" }).eq("id", formValue(formData, "id")).eq("user_id", user.id);
  revalidatePath("/dashboard/materials");
}
