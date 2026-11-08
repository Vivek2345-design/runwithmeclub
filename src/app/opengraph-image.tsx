import { ImageResponse } from "next/og";

export const alt = "RunWithMeClub - Run together. Get faster. Have fun.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#f2541b,#a82f08 60%,#0f766e)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 38, fontWeight: 800 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 16, height: 16, borderRadius: 99, background: "#c7f23a" }} />
          </div>
          RunWithMeClub
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1.03 }}>
          <span>Run together.</span>
          <span>Get faster.</span>
          <span style={{ color: "#c7f23a" }}>Have fun.</span>
        </div>
        <div style={{ fontSize: 30, opacity: 0.9 }}>Group runs · Coached plans · Monthly challenges</div>
      </div>
    ),
    size,
  );
}
