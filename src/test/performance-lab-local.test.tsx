import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerformanceLab, supportedLocalCapture } from "@/components/foundation/PerformanceLab";

const state = vi.hoisted(() => ({
  locale: "en" as "en" | "ar",
  permission: vi.fn(),
  stopTrack: vi.fn(),
  makeURL: vi.fn(),
  revokeURL: vi.fn(),
}));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: state.locale }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) =>
    <a href={to} {...rest}>{children}</a>,
}));
vi.mock("@/components/slams", () => ({
  Page: ({ title, children }: { title: string; children: ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));

const sessions: StubRecorder[] = [];
class StubRecorder {
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? "video/webm";
    sessions.push(this);
  }
  static isTypeSupported(_mime: string) { return true; }
  start(_interval: number) { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["take-media"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

beforeEach(() => {
  state.locale = "en";
  sessions.length = 0;
  state.permission.mockReset();
  state.stopTrack.mockReset();
  state.makeURL.mockReset();
  state.revokeURL.mockReset();
  let count = 0;
  state.makeURL.mockImplementation(() => "blob:slams-take-" + ++count);
  state.permission.mockImplementation(async () => ({ getTracks: () => [{ stop: state.stopTrack }] }));
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: state.permission },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: state.makeURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: state.revokeURL,
  });
  vi.stubGlobal("MediaRecorder", StubRecorder);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function recordA() {
  fireEvent.click(screen.getByRole("button", { name: /Record Take A \(request permission\)/ }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop recording" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
  await waitFor(() => expect(screen.getByText("Take A is ready locally. It was not uploaded or saved to Passport.")).toBeInTheDocument());
}

describe("Performance Lab: consent and local-only evidence", () => {
  it("does not request a camera, microphone or create media before a user click", () => {
    render(<PerformanceLab />);
    expect(supportedLocalCapture()).toBe(true);
    expect(screen.getByRole("heading", { name: "Performance Lab" })).toBeInTheDocument();
    expect(state.permission).not.toHaveBeenCalled();
    expect(sessions).toHaveLength(0);
    expect(state.makeURL).not.toHaveBeenCalled();
    expect(screen.getByText(/no AI observation, automatic score, cloud upload/i)).toBeInTheDocument();
  });
  it("records one explicitly requested take, stops tracks and reveals user-controlled playback/download/delete", async () => {
    render(<PerformanceLab />);
    await recordA();
    expect(state.permission).toHaveBeenCalledTimes(1);
    expect(state.permission).toHaveBeenCalledWith({
      audio: true,
      video: { facingMode: "user" },
    });
    expect(state.stopTrack).toHaveBeenCalled();
    const playback = screen.getByLabelText("Playback take A");
    expect(playback).toHaveAttribute("src", "blob:slams-take-1");
    expect(screen.getByRole("link", { name: "Download this take" })).toHaveAttribute("download", "slams-take-a.webm");
    expect(state.revokeURL).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete take now" }));
    expect(state.revokeURL).toHaveBeenCalledWith("blob:slams-take-1");
    expect(screen.getAllByText("No take in memory")).toHaveLength(2);
  });
  it("provides two independent captures and independent written comparisons with no automatic save", async () => {
    render(<PerformanceLab />);
    await recordA();
    fireEvent.click(screen.getByRole("radio", { name: "Take B" }));
    fireEvent.click(screen.getByRole("radio", { name: "Voice only" }));
    fireEvent.click(screen.getByRole("button", { name: /Record Take B/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Stop recording" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
    await waitFor(() => expect(screen.getByLabelText("Playback take B")).toHaveAttribute("src", "blob:slams-take-2"));
    expect(state.permission).toHaveBeenLastCalledWith({ audio: true, video: false });
    expect(screen.getByLabelText("Playback take A").tagName).toBe("VIDEO");
    expect(screen.getByLabelText("Playback take B").tagName).toBe("AUDIO");
    const copy = screen.getByRole("button", { name: "Copy comparison as text (no media)" });
    expect(copy).toBeDisabled();
    fireEvent.change(screen.getByLabelText("What actually happened in this take?", { exact: false }), { target: { value: "a" } });
  });
  it("does not treat denied device access as a completed take", async () => {
    state.permission.mockRejectedValueOnce(new Error("Permission denied"));
    render(<PerformanceLab />);
    fireEvent.click(screen.getByRole("button", { name: /Record Take A/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Permission was denied");
    expect(screen.getAllByText("No take in memory")).toHaveLength(2);
    expect(sessions).toHaveLength(0);
    expect(state.makeURL).not.toHaveBeenCalled();
  });
  it("releases the live stream and revokes media URLs on navigation away", async () => {
    const view = render(<PerformanceLab />);
    await recordA();
    expect(state.revokeURL).not.toHaveBeenCalled();
    view.unmount();
    expect(state.revokeURL).toHaveBeenCalledWith("blob:slams-take-1");
    expect(state.stopTrack).toHaveBeenCalled();
  });
  it("stops a capture on unmount, and does not write abandoned media to a blob URL", async () => {
    const view = render(<PerformanceLab />);
    fireEvent.click(screen.getByRole("button", { name: /Record Take A/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Stop recording" })).toBeInTheDocument());
    view.unmount();
    expect(sessions[0]?.state).toBe("inactive");
    expect(state.stopTrack).toHaveBeenCalled();
    expect(state.makeURL).not.toHaveBeenCalled();
  });
  it("fails closed without media API support and keeps the working rehearsal link", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    render(<PerformanceLab />);
    expect(screen.getByRole("button", { name: /Record Take A/ })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("does not expose secure local recording");
    expect(screen.getByRole("link", { name: "Return to the Living Scene" })).toHaveAttribute("href", "/scene");
  });
  it("offers Arabic controls and discloses recordings are local and temporary", () => {
    state.locale = "ar";
    render(<PerformanceLab />);
    expect(screen.getByRole("heading", { name: "تسجيل محلي فقط · نسخة تجريبية" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /سجّل المحاولة أ/ })).toBeInTheDocument();
    expect(screen.getByText(/تُمحى لما تخرج/)).toBeInTheDocument();
  });
});
