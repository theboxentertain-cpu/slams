export const ACCOUNT_DELETION_CONFIRMATION = "DELETE MY ACCOUNT";

export type AccountDeletionInput = {
  expectedUserId: string;
  confirmation: string;
  password: string;
};

export type AccountDeletionResult =
  | { ok: true; code: "deleted"; receiptPending: boolean }
  | {
      ok: false;
      code:
        | "unavailable"
        | "confirmation_required"
        | "auth_required"
        | "password_account_required"
        | "reauthentication_failed"
        | "cleanup_incomplete";
    };
