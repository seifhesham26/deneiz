import { appError } from "../app-error";
import {
  deleteBanner,
  getBannerById,
  insertBanner,
  listActiveBanners,
  listAllBanners,
  updateBanner,
} from "./banners.db";

function assertScheduleWindow(startsAt?: Date | null, endsAt?: Date | null): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw appError("BAD_REQUEST", "bannerSchedule");
  }
}

export async function publishBanner(command: {
  title?: string;
  placement: "hero" | "promo";
  imageUrlDesktop: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  assertScheduleWindow(command.startsAt, command.endsAt);
  return insertBanner(command);
}

export async function editBanner(
  id: string,
  command: Partial<{
    title?: string;
    placement: "hero" | "promo";
    imageUrlDesktop: string;
    imageUrlMobile?: string;
    linkUrl?: string;
    isActive: boolean;
    displayOrder: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }>,
) {
  // Patching one date alone must still be checked against the stored other one
  const existing = await getBannerById(id);
  if (!existing) throw appError("NOT_FOUND", "bannerNotFound");
  assertScheduleWindow(
    "startsAt" in command ? command.startsAt : existing.startsAt,
    "endsAt" in command ? command.endsAt : existing.endsAt,
  );
  await updateBanner(id, command);
}

export async function getStorefrontBanners(placement?: "hero" | "promo") {
  return listActiveBanners(placement);
}

export async function getAllBannersForAdmin() {
  return listAllBanners();
}

export async function removeBanner(id: string) {
  await deleteBanner(id);
}
