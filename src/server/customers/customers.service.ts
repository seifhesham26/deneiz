import { getCustomerDetail, listCustomers, setCustomerBan } from "./customers.db";

export async function getCustomerOverview(filters: {
  search?: string;
  page: number;
  pageSize: number;
}) {
  return listCustomers(filters);
}

export async function getCustomerProfile(id: string) {
  return getCustomerDetail(id);
}

export async function toggleCustomerBan(id: string, isBanned: boolean) {
  await setCustomerBan(id, isBanned);
}
