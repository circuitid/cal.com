import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Circuit ID Meet",
  description: _package.description,
  installed: true,
  type: "circuitidmeet_video",
  imageSrc: "/api/app-store/jitsivideo/icon.svg",
  variant: "conferencing",
  categories: ["video"],
  logo: "/api/app-store/jitsivideo/icon.svg",
  publisher: "Circuit ID, Inc.",
  url: "https://www.circuitid.com",
  verified: true,
  rating: 0, // TODO: placeholder for now, pull this from TrustPilot or G2
  reviews: 0, // TODO: placeholder for now, pull this from TrustPilot or G2
  slug: "circuitidmeet",
  title: "Circuit ID Meet",
  trending: true,
  isGlobal: false,
  email: "support@helpdesk.circuitid.com",
  appData: {
    location: {
      linkType: "dynamic",
      type: "integrations:circuitidmeet",
      label: "Circuit ID Meet",
    },
  },
  dirName: "circuitidmeet",
} as AppMeta;

export default metadata;
