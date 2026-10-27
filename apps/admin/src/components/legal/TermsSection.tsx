import type { ReactNode } from 'react';

type TermsSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

const TermsSection = ({ id, title, children }: TermsSectionProps) => (
  <section id={id} className="mb-10 scroll-mt-24">
    {title ? (
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    ) : null}
    <div className="space-y-3 text-gray-700 dark:text-gray-300">{children}</div>
  </section>
);

export default TermsSection;
