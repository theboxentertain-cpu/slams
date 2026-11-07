import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const getAccountDeletionAvailability = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { createAccountDeletionBackend } = await import("./account-lifecycle.server");
      const backend = await createAccountDeletionBackend();
      return { available: backend ? await backend.available() : false };
    } catch {
      return { available: false };
    }
  },
);

export const deleteAccount = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        expectedUserId: z.string().uuid(),
        confirmation: z.string().max(100),
        password: z.string().max(4096),
      })
      .strict(),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const url = new URL(request.url);
    const secure =
      url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    if (
      !secure &&
      !(
        process.env["NODE_ENV"] !== "production" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return { ok: false, code: "unavailable" } as const;
    const authorization = request.headers.get("authorization");
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1] ?? null;
    const { createAccountDeletionBackend, performAccountDeletion } =
      await import("./account-lifecycle.server");
    try {
      return await performAccountDeletion(data, token, await createAccountDeletionBackend());
    } catch {
      return { ok: false, code: "unavailable" } as const;
    }
  });
