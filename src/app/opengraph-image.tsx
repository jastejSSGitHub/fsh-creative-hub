import { ImageResponse } from "next/og";

export const alt = "FSH Creative Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf7ee",
          padding: "48px",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "#ffc94b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            fontSize: 52,
            fontWeight: 800,
            color: "#0b0b0b",
            boxShadow: "0 8px 24px rgba(255, 184, 0, 0.35)",
          }}
        >
          H
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#0b0b0b",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          FSH Creative Hub
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "rgba(11, 11, 11, 0.62)",
            textAlign: "center",
            maxWidth: 760,
            lineHeight: 1.35,
          }}
        >
          Internal creative collaboration — projects, review, feedback, and
          final picks.
        </div>
      </div>
    ),
    { ...size },
  );
}
