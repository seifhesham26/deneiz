import {
  deleteBanner,
  insertBanner,
  listActiveBanners,
  listAllBanners,
  updateBanner,
} from "./banners.db";

function assertScheduleWindow(startsAt?: Date | null, endsAt?: Date | null): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error("Banner end date must be after its start date");
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
  assertScheduleWindow(command.startsAt, command.endsAt);
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
