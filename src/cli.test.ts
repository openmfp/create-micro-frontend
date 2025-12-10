import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";
import { parseCliArgs } from "./cli";

const originalArgv = [...process.argv];

afterEach(() => {
  process.argv = [...originalArgv];
});

describe("parseCliArgs", () => {
  it("returns defaults when no args provided", () => {
    process.argv = ["node", "cli"];
    const result = parseCliArgs(new Command());

    expect(result).toEqual({
      projectName: undefined,
      framework: "angular",
      skipExample: false,
      yes: false,
    });
  });

  it("parses provided options", () => {
    process.argv = [
      "node",
      "cli",
      "custom-app",
      "-f",
      "react",
      "--skip-example",
      "-y",
    ];
    const result = parseCliArgs(new Command());

    expect(result).toEqual({
      projectName: "custom-app",
      framework: "react",
      skipExample: true,
      yes: true,
    });
  });
});
