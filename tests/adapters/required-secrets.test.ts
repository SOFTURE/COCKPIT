import { describe, expect, it } from "vitest";
import { countMergedPullRequests } from "../../src/adapters/deploy/merged-changes.ts";
import { getAddedNames, getRequiredNames } from "../../src/adapters/deploy/required-secrets.ts";

describe("the secrets a compose file requires", () => {
  it("reads both required forms, sorted and without duplicates", () => {
    const compose = ["A: ${ZETA_KEY:?}", "B: https://${APP_HOST:?}/x", "C: ${MAIL_KEY?set it}", "D: ${APP_HOST:?}"].join("\n");
    expect(getRequiredNames(compose)).toEqual(["APP_HOST", "MAIL_KEY", "ZETA_KEY"]);
  });

  it("skips optional and defaulted names and escaped dollars, but counts a literal dollar before a name", () => {
    const compose = ["A: ${OPTIONAL:-}", "B: ${PLAIN}", "C: $${ESCAPED:?}", "D: $$${AFTER_LITERAL:?}", "E: $NAKED"].join("\n");
    expect(getRequiredNames(compose)).toEqual(["AFTER_LITERAL"]);
  });

  it("counts a name in a comment, as the env render does", () => {
    expect(getRequiredNames("# needs ${IN_COMMENT:?}\nservices: {}\n")).toEqual(["IN_COMMENT"]);
  });

  it("finds none in a file without required names", () => {
    expect(getRequiredNames("")).toEqual([]);
  });

  it("names only what the current file adds", () => {
    expect(getAddedNames("${KEEP:?} ${DROPPED:?}", "${KEEP:?} ${NEW_TWO:?} ${NEW_ONE?}")).toEqual(["NEW_ONE", "NEW_TWO"]);
    expect(getAddedNames("${KEEP:?}", "${KEEP:?}")).toEqual([]);
  });
});

describe("the pull requests merged since a release", () => {
  it("counts merge and squash commits once per pull request", () => {
    const messages = ["Merge pull request #4 from example-org/branch\n\nTitle", "Add a page (#5)", "Merge pull request #4 from example-org/branch", "Merge roadmap (#6)"];
    expect(countMergedPullRequests(messages)).toBe(3);
  });

  it("skips commits that name no pull request, also a reference past the first line", () => {
    expect(countMergedPullRequests(["Fix a typo", "Merge remote-tracking branch 'origin/main'", "Body only\n\nSee (#9)"])).toBe(0);
  });

  it("counts none without commits", () => {
    expect(countMergedPullRequests([])).toBe(0);
  });
});
