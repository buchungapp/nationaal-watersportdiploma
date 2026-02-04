import { constants } from "@nawadi/lib";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = constants.APP_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [interRegular, interBold] = await Promise.all([
    fetch(
      new URL("../../assets/fonts/Inter-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer()),
    fetch(new URL("../../assets/fonts/Inter-Bold.ttf", import.meta.url)).then(
      (res) => res.arrayBuffer(),
    ),
  ]);

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #007FFF 0%, #0047AB 100%)",
        color: "white",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 9999,
            backgroundColor: "#FF8000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          NWD
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            {constants.APP_NAME}
          </div>
          <div style={{ fontSize: 22, opacity: 0.9, marginTop: 10 }}>
            {constants.APP_SLOGAN}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 20, opacity: 0.9 }}>
          {constants.WEBSITE_URL.replace(/^https?:\/\//, "")}
        </div>
        <div style={{ fontSize: 20, opacity: 0.9 }}>
          Dé standaard voor veiligheid, kwaliteit en plezier op het water
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
