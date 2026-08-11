import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Informatics Template Lib — Competitive Programming Templates",
    short_name: "ITL",
    description:
      "Terminal-themed competitive programming template library. Fast, organized, contest-ready.",
    start_url: "/",
    display: "minimal-ui",
    background_color: "#06141B",
    theme_color: "#9BA8AB",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
