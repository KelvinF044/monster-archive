
import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
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
          border: "3px solid #a855f7",
          borderRadius: 15,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            color: "#ffffff",
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: "-5px",
          }}
        >
          M
          <span
            style={{
              color: "#c084fc",
              fontSize: 30,
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
