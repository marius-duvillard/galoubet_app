// Section sémantique : titre en overline, section aria-labelledby vers ce titre.

import type { ReactNode } from "react";

interface FieldSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function FieldSection({ id, title, children }: FieldSectionProps) {
  return (
    <section className="field" aria-labelledby={id}>
      <h2 className="field__title" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}
