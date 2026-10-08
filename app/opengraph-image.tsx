import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME}: beauty, fashion and wellness in Kenya`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social preview when a page has no photo of its own. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #2d1a2d 0%, #4d2b45 55%, #6b3558 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          <span>LUXE</span>
          <span style={{ color: "#f9a8d4" }}>STORE</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#fbcfe8" }}>{SITE_TAGLINE}</div>
        <div style={{ marginTop: 40, fontSize: 26, letterSpacing: 6, color: "#e9d5ff" }}>BEAUTY • FASHION • WELLNESS</div>
      </div>
    ),
    size
  );
}
