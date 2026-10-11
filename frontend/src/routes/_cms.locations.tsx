import { createFileRoute } from "@tanstack/react-router";
import { LocationsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/locations")({
  head: () => ({
    meta: [
      { title: "Locations Library — MysteryCase CMS" },
    ],
  }),
  component: LocationsLibrary,
});
