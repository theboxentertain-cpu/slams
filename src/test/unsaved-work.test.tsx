import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnsavedWorkProvider, useUnsavedWork } from "@/lib/unsaved-work";

type BlockerOptions = { shouldBlockFn: () => boolean; enableBeforeUnload: () => boolean };
const mock = vi.hoisted(() => ({ options: null as BlockerOptions | null, locale: "en" }));
vi.mock("@tanstack/react-router", () => ({
  useBlocker: (options: BlockerOptions) => {
    mock.options = options;
  },
}));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: mock.locale }) }));
function Editor({ dirty, name = "editor" }: { dirty: boolean; name?: string }) {
  const markSaved = useUnsavedWork(dirty);
  return <button onClick={markSaved}>{name}</button>;
}
beforeEach(() => {
  mock.locale = "en";
  mock.options = null;
  vi.spyOn(window, "confirm").mockReturnValue(false);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Unsaved private editor navigation", () => {
  it("protects router and browser leave only while an editor is dirty, honoring the leave decision", () => {
    const view = render(
      <UnsavedWorkProvider>
        <Editor dirty={false} />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.enableBeforeUnload()).toBe(false);
    expect(mock.options?.shouldBlockFn()).toBe(false);
    expect(window.confirm).not.toHaveBeenCalled();
    view.rerender(
      <UnsavedWorkProvider>
        <Editor dirty />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    expect(mock.options?.shouldBlockFn()).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Leave without saving?"));
    vi.mocked(window.confirm).mockReturnValue(true);
    expect(mock.options?.shouldBlockFn()).toBe(false);
    view.rerender(
      <UnsavedWorkProvider>
        <Editor dirty={false} />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.enableBeforeUnload()).toBe(false);
  });
  it("clears a confirmed save synchronously without bypassing another dirty editor and cleans up unmounted editors", () => {
    const view = render(
      <UnsavedWorkProvider>
        <Editor dirty name="first" />
        <Editor dirty name="second" />
      </UnsavedWorkProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "second" }));
    expect(mock.options?.shouldBlockFn()).toBe(false);
    view.rerender(
      <UnsavedWorkProvider>
        <Editor dirty={false} name="first" />
        <Editor dirty={false} name="second" />
      </UnsavedWorkProvider>,
    );
    view.rerender(
      <UnsavedWorkProvider>
        <Editor dirty name="first" />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    view.rerender(<UnsavedWorkProvider>{null}</UnsavedWorkProvider>);
    expect(mock.options?.enableBeforeUnload()).toBe(false);
  });
  it("uses the current language for the leave prompt and supports isolated editor tests without a provider", () => {
    const view = render(
      <UnsavedWorkProvider>
        <Editor dirty />
      </UnsavedWorkProvider>,
    );
    mock.locale = "ar";
    view.rerender(
      <UnsavedWorkProvider>
        <Editor dirty />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.shouldBlockFn()).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith(
      "عندك تعديلات غير محفوظة. لو خرجت هتضيع. تخرج من غير حفظ؟",
    );
    view.unmount();
    render(<Editor dirty />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });
});
