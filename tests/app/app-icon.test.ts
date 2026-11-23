import { describe, expect, it } from "vitest";
import AppleIcon, { size as appleIconSize } from "../../app/apple-icon.tsx";
import Icon, { size as iconSize } from "../../app/icon.tsx";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function readPngSize(response: Response): Promise<{ width: number; height: number }> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  const header = new DataView(bytes.buffer, bytes.byteOffset + 16, 8);
  return { width: header.getUint32(0), height: header.getUint32(4) };
}

describe("the app icon", () => {
  it("draws the tab icon as a 32 × 32 PNG", async () => {
    const response = Icon();
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(iconSize).toEqual({ width: 32, height: 32 });
    expect(await readPngSize(response)).toEqual(iconSize);
  });

  it("draws the home screen icon as a 180 × 180 PNG", async () => {
    const response = AppleIcon();
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(appleIconSize).toEqual({ width: 180, height: 180 });
    expect(await readPngSize(response)).toEqual(appleIconSize);
  });
});
