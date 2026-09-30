import { ImageResponse } from "next/og";
import { starPoints } from "@/lib/star";

const SIZES: Record<string, number> = { "icon-192.png": 192, "icon-512.png": 512 };
const GREEN = "#1f5c48";
const GOLD = "#d4a83f";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SIZES).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/[file]">) {
  const { file } = await params;
  const size = SIZES[file];
  if (!size) return new Response(null, { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: GREEN, borderRadius: size * 0.22 }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48">
          <polygon points={starPoints(24, 23, 13)} fill={GOLD} strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
