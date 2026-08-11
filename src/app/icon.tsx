import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          border: "1.5px solid #9BA8AB",
          borderRadius: "4px",
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
            fontSize: "11px",
            color: "#CCD0CF",
            letterSpacing: "-0.5px",
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
