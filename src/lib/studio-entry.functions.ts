import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { STUDIO_ENTRY_COOKIE } from "./studio-entry";
/** Public non-sensitive preference; does not read or establish authentication. */
export const getStudioEntry = createServerFn({ method: "GET" }).handler(
  () => getCookie(STUDIO_ENTRY_COOKIE) === "1",
);
