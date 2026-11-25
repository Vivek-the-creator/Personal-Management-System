import { useMemo } from "react";
import { highlightTokens } from "@/utils/search.utils";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const segments = useMemo(() => highlightTokens(text, query), [text, query]);

  return (
    <span className={className}>
      {segments.map((seg, idx) =>
        seg.highlight ? (
          <mark
            key={idx}
            className="rounded-[3px] bg-primary/20 px-0.5 font-semibold text-foreground"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={idx}>{seg.text}</span>
        )
      )}
    </span>
  );
}
