"use client";

import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return trpc.settings.updateUserRole.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useGetAdminUsers() {
  return trpc.settings.getUsers.useQuery();
}
