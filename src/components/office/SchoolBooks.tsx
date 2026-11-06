import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties, Ref } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { totalTerms } from "@/data/schools";
import { BOOK_DESIGNS } from "./office-data";

export function CoverDrawing({ motif }: { motif: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {motif === "classical" && (
        <>
          <path d="M12 15h76v70H12zM18 21h64v58H18zM25 30h50M25 70h50M37 60V40h26v20M33 40h34M33 60h34" />
          <path d="M50 5l5 7-5 7-5-7zM50 81l5 7-5 7-5-7z" fill="currentColor" />
        </>
      )}
      {motif === "listening" && (
        <>
          <path d="M20 68C80 5 8 14 57 74S85 12 33 46" strokeWidth="3" />
          <circle cx="74" cy="25" r="5" fill="currentColor" />
        </>
      )}
      {motif === "architecture" && (
        <>
          <path d="M16 84V29h68v55M29 84V38a21 21 0 0 1 42 0v46M40 84V49h20v35M12 84h76M12 24h76M30 16h40" />
          <path d="M50 8v76M16 56h68" opacity=".5" />
        </>
      )}
      {motif === "geometry" && (
        <>
          <path d="M15 15h70v70H15z" strokeWidth="7" />
          <path d="M15 85l70-70M15 50h70M50 15v70" strokeWidth="4" />
          <circle cx="50" cy="50" r="11" fill="currentColor" />
        </>
      )}
      {motif === "gesture" && (
        <>
          <circle cx="60" cy="18" r="6" />
          <path d="M58 26Q30 48 52 59l-25 30M51 57l29 25M49 39L21 25M49 39l34-7M16 72Q65 100 90 25M8 55Q66 80 85 9" />
        </>
      )}
      {motif === "movement" && (
        <>
          <path
            d="M12 78L38 20l23 59 29-60M10 90l24-39 33 42 24-46M14 38l22-30 31 38 22-38"
            strokeWidth="3"
          />
          <circle cx="61" cy="79" r="5" fill="currentColor" />
        </>
      )}
      {motif === "inner" && (
        <>
          <path d="M10 48q40-43 80 0-40 42-80 0z" />
          <circle cx="50" cy="48" r="14" />
          <circle cx="50" cy="48" r="5" fill="currentColor" />
          <path d="M50 16v64M19 74q31 22 62 0" opacity=".65" />
        </>
      )}
      {motif === "space" && (
        <>
          <path d="M13 13h74v74H13zM13 38h74M13 62h74M38 13v74M62 13v74" opacity=".5" />
          <circle cx="38" cy="38" r="22" />
          <circle cx="62" cy="62" r="9" fill="currentColor" />
          <path d="M13 87l74-74" />
        </>
      )}
    </svg>
  );
}

export function BookCover({
  book,
  mini = false,
}: {
  book: (typeof BOOK_DESIGNS)[number];
  mini?: boolean;
}) {
  return (
    <span
      className={`school-book ${mini ? "school-book-mini" : ""}`}
      style={{ "--book-color": book.color, "--book-ink": book.ink } as CSSProperties}
    >
      <span className="book-pages" aria-hidden="true" />
      <span className="book-cover">
        <span className="book-edition">
          <T>THE ACTOR’S LIBRARY</T>
        </span>
        <span className="book-title">{book.title}</span>
        <CoverDrawing motif={book.motif} />
        <span className="book-footer">
          <T>SLAMS · CONSERVATORY</T>
        </span>
      </span>
      <span className="book-spine" aria-hidden="true" />
    </span>
  );
}

export function DeskBooks({
  onOpen,
  buttonRef,
}: {
  onOpen: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="desk-books office-object"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label="Explore the eight acting-school books — The Conservatory"
    >
      <span className="mini-book-row" aria-hidden="true">
        {BOOK_DESIGNS.map((book) => (
          <BookCover key={book.slug} book={book} mini />
        ))}
      </span>
      <span className="object-label">
        <strong>
          <T>Explore the eight schools </T>
          <ArrowUpRight aria-hidden="true" size={14} />
        </strong>
        <span className="book-shelf-subtitle">
          <T>Open the actor’s library</T>
        </span>
      </span>
    </button>
  );
}

export function SchoolBooks({
  open,
  onOpenChange,
  motion = true,
  onReturnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motion?: boolean;
  onReturnFocus?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="office-library"
        data-motion={motion ? "on" : "off"}
        onCloseAutoFocus={(event) => {
          if (onReturnFocus) {
            event.preventDefault();
            onReturnFocus();
          }
        }}
      >
        <div className="library-heading">
          <span className="office-kicker">
            <T>FROM THE DIRECTOR’S DESK</T>
          </span>
          <DialogTitle>
            <T>The actor’s library.</T>
          </DialogTitle>
          <DialogDescription>
            <T>
              Eight schools. Pick a book, find your way in. The curriculum remains provisional; only
              reviewed material can be completed.
            </T>
          </DialogDescription>
        </div>
        <div className="library-grid">
          {BOOK_DESIGNS.map((book) => (
            <Link
              className="library-book-link"
              key={book.slug}
              to="/conservatory/$school"
              params={{ school: book.slug }}
              aria-label={`Open ${book.school.name} school`}
              onClick={() => onOpenChange(false)}
            >
              <BookCover book={book} />
              <span className="library-book-info">
                <strong>{book.school.name}</strong>
                <span>
                  {book.school.years} years · {totalTerms(book.school)} terms
                </span>
                <span className="library-school-focus">{book.school.focus}</span>
                <small>
                  <T>Provisional structure · Open school for availability</T>
                </small>
              </span>
            </Link>
          ))}
        </div>
        <Link className="library-all-link" to="/conservatory" onClick={() => onOpenChange(false)}>
          <T>View the full Conservatory </T>
          <ArrowUpRight aria-hidden="true" size={12} />
        </Link>
      </DialogContent>
    </Dialog>
  );
}
