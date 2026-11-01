import { expect, it, vi } from "vitest";
import { enterStudio, hasEnteredStudio, STUDIO_ENTRY_COOKIE } from "@/lib/studio-entry";
it("uses only a non-auth entry preference and still enters if cookie access is blocked", () => {
  document.cookie = `${STUDIO_ENTRY_COOKIE}=; Max-Age=0; Path=/`;
  localStorage.clear();
  const read = vi.spyOn(document, "cookie", "get").mockImplementation(() => {
    throw new Error("Blocked");
  });
  expect(hasEnteredStudio()).toBe(false);
  read.mockRestore();
  expect(hasEnteredStudio()).toBe(false);
  localStorage.setItem("slams.passport.v1", "retained");
  expect(hasEnteredStudio()).toBe(true);
  enterStudio();
  expect(hasEnteredStudio()).toBe(true);
  expect(document.cookie).toContain(`${STUDIO_ENTRY_COOKIE}=1`);
  document.cookie = `${STUDIO_ENTRY_COOKIE}=; Max-Age=0; Path=/`;
  expect(hasEnteredStudio()).toBe(true);
  expect(localStorage.getItem("slams.passport.v1")).toBe("retained");
});
