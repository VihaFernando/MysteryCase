import { createFileRoute } from "@tanstack/react-router";
import { LocationsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/locations")({
  head: () => ({
    meta: [
      { title: "Locations Library — MysteryCase CMS" },
      { name: "description", content: "Locations Library for the MysteryCase content team." },
      { property: "og:title", content: "Locations Library — MysteryCase CMS" },
      { property: "og:description", content: "Locations Library for the MysteryCase content team." },
    ],
  }),
  component: LocationsLibrary,
});
