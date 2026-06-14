"use client";

import { useEffect, useState } from "react";

const words = ["understand", "discover", "evaluate"];
const typingDelay = 88;
const deletingDelay = 52;
const holdDelay = 1250;

export default function AnimatedTitleWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(words[0].length);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = window.setTimeout(
      () => {
        if (isDeleting) {
          if (visibleLength > 0) {
            setVisibleLength((length) => length - 1);
            return;
          }

          setIsDeleting(false);
          setWordIndex((index) => (index + 1) % words.length);
          return;
        }

        if (visibleLength < currentWord.length) {
          setVisibleLength((length) => length + 1);
          return;
        }

        setIsDeleting(true);
      },
      isDeleting
        ? deletingDelay
        : visibleLength === currentWord.length
          ? holdDelay
          : typingDelay,
    );

    return () => window.clearTimeout(timeout);
  }, [isDeleting, visibleLength, wordIndex]);

  const currentWord = words[wordIndex];

  return (
    <span className="inline-flex min-w-[10.4ch] items-baseline text-[#4EC9B0]">
      <span>{currentWord.slice(0, visibleLength)}</span>
      <span
        aria-hidden="true"
        className="typing-cursor ml-1 inline-block h-[0.92em] w-[0.08em] translate-y-[0.1em] bg-[#DCDCAA] shadow-[0_0_16px_rgba(220,220,170,0.52)]"
      />
    </span>
  );
}
