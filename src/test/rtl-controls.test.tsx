import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider, LanguageSwitch, LANGUAGE_KEY } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

beforeEach(() => {
  localStorage.setItem(LANGUAGE_KEY, "ar");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.dir = "ltr";
});

it("provides RTL to controls and returns them to LTR when English is selected", async () => {
  render(
    <LanguageProvider>
      <LanguageSwitch />
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="first">Content</TabsContent>
      </Tabs>
      <Slider defaultValue={[30]} aria-label="Intensity" />
    </LanguageProvider>,
  );
  await waitFor(() => expect(screen.getByRole("tablist").closest('[dir="rtl"]')).not.toBeNull());
  const slider = screen.getByRole("slider");
  expect(slider.closest('[dir="rtl"]')).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  await waitFor(() => expect(screen.getByRole("tablist").closest('[dir="ltr"]')).not.toBeNull());
  expect(slider.closest('[dir="ltr"]')).not.toBeNull();
});

it("keeps switch state interactive in Arabic", () => {
  render(
    <LanguageProvider>
      <Switch aria-label="Motion" />
    </LanguageProvider>,
  );
  const control = screen.getByRole("switch", { name: "Motion" });
  expect(control).toHaveAttribute("aria-checked", "false");
  fireEvent.click(control);
  expect(control).toHaveAttribute("aria-checked", "true");
  fireEvent.keyDown(control, { key: "Escape" });
  expect(control).toHaveAttribute("aria-checked", "true");
});

it("carries Arabic direction into portaled profile-style menus", async () => {
  render(
    <LanguageProvider>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Profile</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Account</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </LanguageProvider>,
  );
  expect(await screen.findByRole("menu")).toHaveAttribute("dir", "rtl");
  expect(screen.getByRole("menuitem", { name: "Account" })).toBeVisible();
});
