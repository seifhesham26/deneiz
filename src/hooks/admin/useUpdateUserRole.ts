"use client";

import { trpc } from "@/lib/trpc-client";

export function useUpdateUserRole() {
  const utils = trpc.useUtils();
  return trpc.settings.updateUserRole.useMutation({
    onSuccess: () => {
      void utils.settings.invalidate();
    },
  });
}

export function useGetAdminUsers() {
  return trpc.settings.getUsers.useQuery();
}
