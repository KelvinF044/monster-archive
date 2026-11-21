
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
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090d",
          border: "7px solid #a855f7",
          borderRadius: 42,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            color: "#ffffff",
            fontSize: 130,
            fontWeight: 900,
            letterSpacing: "-12px",
          }}
        >
          M
          <span
            style={{
              color: "#c084fc",
              fontSize: 75,
              letterSpacing: "0px",
            }}
          >
            .
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
