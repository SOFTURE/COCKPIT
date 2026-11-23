import { describe, expect, it } from "vitest";
import { renderTable, toCellText } from "../../cli/render-table.ts";

describe("renderTable", () => {
  it("pads every column but the last to its widest cell, with a dashed line under the headers", () => {
    expect(renderTable(["Name", "Age"], [["alpha", "9 days"], ["b", "today"]])).toBe(
      ["Name   Age", "-----  ------", "alpha  9 days", "b      today"].join("\n"),
    );
  });

  it("prints only the headers when there are no rows, and fills a missing cell with nothing", () => {
    expect(renderTable(["A", "B"], [])).toBe("A  B\n-  -");
    expect(renderTable(["A", "B", "C"], [["x"]])).toBe("A  B  C\n-  -  -\nx");
  });

  it("replaces control characters with spaces so a cell stays on one line", () => {
    expect(toCellText("a\nb\u001b[31mc\u0007\u009b")).toBe("a b [31mc  ");
  });
});
