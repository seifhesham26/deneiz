import {
  countSuperAdmins,
  getSettings,
  getUserRole,
  listAdminUsers,
  updateSettings as persistSettings,
  updateUserRole,
} from "./settings.db";
import { appError } from "../app-error";

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

export async function changeUserRole(
  userId: string,
  role: "super_admin" | "manager" | "staff" | "customer",
  actingUserId: string,
) {
  // One click could otherwise leave the store with nobody able to manage roles
  if (userId === actingUserId) throw appError("FORBIDDEN", "cannotDemoteSelf");

  if (role !== "super_admin") {
    const [current, superAdmins] = await Promise.all([getUserRole(userId), countSuperAdmins()]);
    if (current === "super_admin" && superAdmins <= 1) {
      throw appError("CONFLICT", "lastSuperAdmin");
    }
  }

  await updateUserRole(userId, role);
}
