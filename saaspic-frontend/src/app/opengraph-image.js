import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#F5FBFC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 86,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          SaaS
          <span style={{ color: "#0E7490" }}>pin</span>
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            color: "#334155",
          }}
        >
          SaaS Deals, Reviews & Comparisons
        </div>
      </div>
    ),
    size
  );
}