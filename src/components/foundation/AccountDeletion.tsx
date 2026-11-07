import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ACCOUNT_DELETION_CONFIRMATION, type AccountDeletionResult } from "@/lib/account-lifecycle";
import { deleteAccount, getAccountDeletionAvailability } from "@/lib/account-lifecycle.functions";
import { btnSecondary } from "@/components/slams";

const copy = {
  en: {
    title: "Delete account and owned data",
    description:
      "This permanently deletes your cloud projects, auditions, script originals, journals, rehearsals, Passport entries and progress. There is no recovery period. Browser-only guest records are separate.",
    checking: "Checking secure account deletion…",
    unavailable:
      "Secure account deletion is unavailable on this deployment. No data has been deleted. Contact the studio administrator.",
    signedOut: "Sign in to manage deletion of your own account.",
    open: "Delete my account…",
    password: "Current account password",
    confirmation: "Type DELETE MY ACCOUNT to confirm",
    submit: "Permanently delete my account",
    pending: "Deleting account and owned data…",
    cancel: "Cancel",
    deleted: "Your account and owned cloud data have been deleted.",
    signoutIssue:
      "Your account has been deleted. Reload this page to clear the old sign-in display.",
    auth_required: "Your sign-in is no longer active. Sign in again before requesting deletion.",
    confirmation_required: "Enter your current password and type DELETE MY ACCOUNT exactly.",
    password_account_required:
      "This deletion flow requires an email-and-password account. Contact the studio administrator for secure account deletion.",
    reauthentication_failed:
      "We could not verify your current password. No deletion was started. Try again or reset your password.",
    cleanup_incomplete:
      "Deletion has not finished. If cleanup started, your cloud data is locked against further access and writes. Sign in and retry deletion with your current password, or contact the studio administrator. Some data may already be deleted; this cannot be undone.",
    transport:
      "The result could not be confirmed. Check your connection and sign in again. If deletion started, your cloud data remains locked; retry or contact the studio administrator.",
  },
  ar: {
    title: "حذف الحساب والبيانات المملوكة",
    description:
      "سيُحذف نهائيًا كل ما يخصك في السحابة من مشاريع وتجارب أداء ونصوص أصلية ويوميات وتدريبات وسجلات جواز الممثل والتقدم. لا توجد مهلة للاستعادة. سجلات الضيف في المتصفح منفصلة.",
    checking: "جارٍ التحقق من خدمة حذف الحساب الآمنة…",
    unavailable:
      "حذف الحساب الآمن غير متاح في هذا الإصدار. لم تُحذف أي بيانات. تواصل مع مسؤول الاستوديو.",
    signedOut: "سجّل الدخول لإدارة حذف حسابك.",
    open: "حذف حسابي…",
    password: "كلمة مرور الحساب الحالية",
    confirmation: "اكتب DELETE MY ACCOUNT للتأكيد",
    submit: "حذف حسابي نهائيًا",
    pending: "جارٍ حذف الحساب والبيانات المملوكة…",
    cancel: "إلغاء",
    deleted: "حُذف حسابك وبياناتك السحابية المملوكة.",
    signoutIssue: "حُذف حسابك. أعد تحميل الصفحة لإزالة عرض تسجيل الدخول القديم.",
    auth_required: "جلسة الدخول لم تعد صالحة. سجّل الدخول مجددًا قبل طلب الحذف.",
    confirmation_required: "أدخل كلمة المرور الحالية واكتب DELETE MY ACCOUNT كما هي تمامًا.",
    password_account_required:
      "يتطلب مسار الحذف هذا حسابًا بالبريد الإلكتروني وكلمة المرور. تواصل مع مسؤول الاستوديو لحذف حسابك بأمان.",
    reauthentication_failed:
      "تعذر التحقق من كلمة المرور الحالية. لم يبدأ الحذف. أعد المحاولة أو أعد تعيين كلمة المرور.",
    cleanup_incomplete:
      "لم يكتمل الحذف. إذا بدأت إزالة البيانات، فهي مقفلة أمام الوصول والكتابة. سجّل الدخول وأعد طلب الحذف بكلمة المرور الحالية، أو تواصل مع مسؤول الاستوديو. ربما حُذفت بعض البيانات بالفعل ولا يمكن التراجع عن ذلك.",
    transport:
      "تعذر تأكيد النتيجة. تحقق من الاتصال وسجّل الدخول مجددًا. إذا بدأ الحذف، تظل بياناتك مقفلة؛ أعد المحاولة أو تواصل مع مسؤول الاستوديو.",
  },
};

export function AccountDeletion() {
  const { locale } = useLanguage();
  const text = copy[locale === "ar" ? "ar" : "en"];
  const { user, loading, signOut } = useSession();
  const userId = user?.id;
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const [availability, setAvailability] = useState<"checking" | "ready" | "unavailable">(
    "checking",
  );
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    Exclude<AccountDeletionResult, { ok: true }>["code"] | "transport" | null
  >(null);
  const [deleted, setDeleted] = useState(false);
  const [signoutIssue, setSignoutIssue] = useState(false);

  useEffect(() => {
    let active = true;
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setError(null);
    setPending(false);
    setAvailability("checking");
    if (!userId)
      return () => {
        active = false;
      };
    void getAccountDeletionAvailability()
      .then((result) => {
        if (active) setAvailability(result.available ? "ready" : "unavailable");
      })
      .catch(() => {
        if (active) setAvailability("unavailable");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || availability !== "ready" || !userId) return;
    const requestUserId = user?.id;
    const submittedPassword = password;
    setPassword("");
    setPending(true);
    setError(null);
    try {
      const result = await deleteAccount({
        data: { expectedUserId: userId, confirmation, password: submittedPassword },
      });
      if (currentUserId.current !== requestUserId) return;
      if (!result.ok) {
        setError(result.code);
        return;
      }
      setConfirmation("");
      setOpen(false);
      setDeleted(true);
      try {
        await signOut();
      } catch {
        setSignoutIssue(true);
      }
    } catch {
      if (currentUserId.current === requestUserId) setError("transport");
    } finally {
      if (currentUserId.current === requestUserId) setPending(false);
    }
  }

  return (
    <section className="foundation-stack" aria-labelledby="account-deletion-title">
      <h3 id="account-deletion-title">{text.title}</h3>
      {deleted ? (
        <p role="status">{signoutIssue ? text.signoutIssue : text.deleted}</p>
      ) : loading ? null : !user ? (
        <p>
          <Link to="/auth">{text.signedOut}</Link>
        </p>
      ) : (
        <>
          <p>{text.description}</p>
          {availability !== "ready" ? (
            <p role="status">{availability === "checking" ? text.checking : text.unavailable}</p>
          ) : open ? (
            <form onSubmit={(event) => void submit(event)} className="foundation-stack">
              <label>
                {text.password}
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={4096}
                  value={password}
                  disabled={pending}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label>
                {text.confirmation}
                <input
                  autoComplete="off"
                  dir="ltr"
                  required
                  maxLength={100}
                  value={confirmation}
                  disabled={pending}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className={btnSecondary}
                disabled={pending || !password || confirmation !== ACCOUNT_DELETION_CONFIRMATION}
              >
                {pending ? text.pending : text.submit}
              </button>
              <button
                type="button"
                className={btnSecondary}
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setPassword("");
                  setConfirmation("");
                  setError(null);
                }}
              >
                {text.cancel}
              </button>
            </form>
          ) : (
            <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>
              {text.open}
            </button>
          )}
          {error && <p role="alert">{text[error]}</p>}
        </>
      )}
    </section>
  );
}
