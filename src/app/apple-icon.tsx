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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          border: "3px solid #9BA8AB",
          borderRadius: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at center, rgba(155, 168, 171, 0.3) 0%, rgba(0, 0, 0, 0) 80%)",
            display: "flex",
          }}
        />
        {/* Text [CP] */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            color: "#CCD0CF",
            fontFamily: "monospace",
            fontSize: "64px",
            fontWeight: "bold",
            position: "relative",
          }}
        >
          <span style={{ color: "#9BA8AB" }}>[</span>
          <span style={{ color: "#CCD0CF", marginLeft: "4px", marginRight: "4px" }}>
            CP
          </span>
          <span style={{ color: "#9BA8AB" }}>]</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
