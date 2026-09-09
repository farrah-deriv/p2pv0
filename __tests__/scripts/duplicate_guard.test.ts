import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(
  process.cwd(),
  ".claude/skills/ship-change-slack/scripts/duplicate_guard.sh",
);

function runGuard(
  prHits: string[],
  issueHits: string[],
  resume = "",
): { stdout: string; status: number } {
  const dir = mkdtempSync(join(tmpdir(), "dup-guard-"));
  const prFile = join(dir, "pr.txt");
  const issueFile = join(dir, "issue.txt");
  writeFileSync(prFile, prHits.length ? `${prHits.join("\n")}\n` : "");
  writeFileSync(issueFile, issueHits.length ? `${issueHits.join("\n")}\n` : "");
  try {
    const stdout = execFileSync(
      "bash",
      resume ? [SCRIPT, prFile, issueFile, resume] : [SCRIPT, prFile, issueFile],
      { encoding: "utf8" },
    );
    return { stdout, status: 0 };
  } catch (err) {
    const failed = err as { status?: number; stdout?: string };
    return { stdout: failed.stdout ?? "", status: failed.status ?? 1 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("duplicate_guard.sh", () => {
  it("proceeds with no output on a fresh thread", () => {
    const result = runGuard([], []);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("continues a single open PR instead of aborting as a duplicate", () => {
    // Regression: follow-ups on the same Slack thread used to hand back
    // `DUPLICATE: pr=[3151] issue=[]`, which forced closing the PR to retry.
    const result = runGuard(["3151"], [], "3116");
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("CONTINUE: pr=3151");
  });

  it("continues the open PR even when resume_issue_number is omitted", () => {
    const result = runGuard(["3151"], []);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("CONTINUE: pr=3151");
  });

  it("continues the open PR even when a leftover issue is not the resumed one", () => {
    // The issue is the one the PR already closes. Aborting here is what
    // forced "close the PR and re-dispatch" as a workaround.
    const result = runGuard(["3151"], ["3116"], "9999");
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("CONTINUE: pr=3151");
  });

  it("strips the resumed issue so it does not fight itself", () => {
    const result = runGuard(["3151"], ["3116"], "3116");
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("CONTINUE: pr=3151");
  });

  it("duplicates when two open PRs share the thread", () => {
    const result = runGuard(["3126", "3148"], []);
    expect(result.status).toBe(1);
    expect(result.stdout.trim()).toBe("DUPLICATE: pr=[3126 3148] issue=[]");
  });

  it("duplicates a leftover issue with no PR", () => {
    const result = runGuard([], ["3116"]);
    expect(result.status).toBe(1);
    expect(result.stdout.trim()).toBe("DUPLICATE: pr=[] issue=[3116]");
  });
});
