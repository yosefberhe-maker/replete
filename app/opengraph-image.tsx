import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Replete — Precision nutrition for GLP-1 users. Personalized deficiency profile, supplement stack, and meal framework.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(ellipse at top, rgba(16,185,129,0.18), transparent 55%), linear-gradient(180deg, #080C14 0%, #0a1322 100%)",
          color: "#F1F5F9",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#10B981",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>
            Replete
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#10B981",
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            Precision nutrition for GLP-1 users
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            GLP-1 is changing your body. Your nutrition plan hasn&apos;t kept
            up.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#94A3B8",
            fontSize: 26,
          }}
        >
          <div>Personalized deficiency profile · in 2 minutes</div>
          <div style={{ color: "#F1F5F9", fontWeight: 600 }}>replete.health</div>
        </div>
      </div>
    ),
    size,
  );
}
