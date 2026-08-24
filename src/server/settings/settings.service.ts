import { getSettings, listAdminUsers, updateSettings as persistSettings, updateUserRole } from "./settings.db";

export async function getStoreSettings() {
  return getSettings();
}

export async function changeStoreSettings(
  patch: Partial<{
    storeNameEn: string;
    storeNameAr: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    defaultLocale: "ar" | "en";
    shippingFee: number;
    freeShippingThreshold: number;
    lowStockThreshold: number;
  }>,
) {
  return persistSettings(patch);
}

export async function getAdminUsers() {
  return listAdminUsers();
}

export async function changeUserRole(userId: string, role: "super_admin" | "manager" | "staff" | "customer") {
  await updateUserRole(userId, role);
}
