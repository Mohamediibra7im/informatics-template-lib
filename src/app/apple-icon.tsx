import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#06141B",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "3px solid #9BA8AB",
          borderRadius: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at center, rgba(155, 168, 171, 0.35) 0%, rgba(0, 0, 0, 0) 80%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: "56px",
            color: "#CCD0CF",
            letterSpacing: "-1px",
            position: "relative",
          }}
        >
          ITL
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
