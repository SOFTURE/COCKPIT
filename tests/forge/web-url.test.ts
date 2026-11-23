import { describe, expect, it } from "vitest";
import { createRepositoryLinks, getForgeWebUrl } from "../../src/forge/web-url.ts";

describe("getForgeWebUrl", () => {
  it("maps the public API host to the public web host", () => {
    expect(getForgeWebUrl("https://api.github.com")).toBe("https://github.com");
    expect(getForgeWebUrl("https://api.github.com/")).toBe("https://github.com");
  });

  it("drops the API path of an enterprise server", () => {
    expect(getForgeWebUrl("https://forge.example.test/api/v3")).toBe("https://forge.example.test");
  });

  it("keeps the origin of any other base, port included", () => {
    expect(getForgeWebUrl("http://127.0.0.1:3101")).toBe("http://127.0.0.1:3101");
  });
});

describe("createRepositoryLinks", () => {
  const links = createRepositoryLinks("https://github.com", "example-org/alpha-app", "main");

  it("links the repository, a file on the branch and a folder on the branch", () => {
    expect(links.repository).toBe("https://github.com/example-org/alpha-app");
    expect(links.file("context/foundation/roadmap.md")).toBe("https://github.com/example-org/alpha-app/blob/main/context/foundation/roadmap.md");
    expect(links.folder("context/changes/first-screen")).toBe("https://github.com/example-org/alpha-app/tree/main/context/changes/first-screen");
  });

  it("encodes each segment of the path and of the branch", () => {
    const odd = createRepositoryLinks("https://github.com/", "example-org/alpha-app", "release/1 0");
    expect(odd.file("/docs/a b.md")).toBe("https://github.com/example-org/alpha-app/blob/release/1%200/docs/a%20b.md");
  });
});
