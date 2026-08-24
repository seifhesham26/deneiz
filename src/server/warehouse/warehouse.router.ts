import { adminProcedure, router } from "../trpc";
import { z } from "zod";
import {
  productAssignmentCreateSchema,
  storageLocationCreateSchema,
} from "./warehouse.validators";
import { deleteAssignment } from "./warehouse.db";
import {
  addStorageLocation,
  assignProductToLocation,
  getWarehouseAssignments,
  getWarehouseOverview,
} from "./warehouse.service";

export const warehouseRouter = router({
  getLocations: adminProcedure.query(() => getWarehouseOverview()),

  createLocation: adminProcedure
    .input(storageLocationCreateSchema)
    .mutation(({ input }) => addStorageLocation(input)),

  getAssignments: adminProcedure.query(() => getWarehouseAssignments()),

  assignProduct: adminProcedure
    .input(productAssignmentCreateSchema)
    .mutation(({ input }) => assignProductToLocation(input)),

  removeAssignment: adminProcedure.input(z.object({ id: z.uuid() })).mutation(({ input }) => {
    return deleteAssignment(input.id);
  }),
});
