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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #9BA8AB",
          borderRadius: "6px",
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
            background: "radial-gradient(circle at center, rgba(155, 168, 171, 0.25) 0%, rgba(0, 0, 0, 0) 80%)",
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
            fontSize: "12px",
            fontWeight: "bold",
            position: "relative",
          }}
        >
          <span style={{ color: "#9BA8AB" }}>[</span>
          <span style={{ color: "#CCD0CF", marginLeft: "1px", marginRight: "1px" }}>CP</span>
          <span style={{ color: "#9BA8AB" }}>]</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
