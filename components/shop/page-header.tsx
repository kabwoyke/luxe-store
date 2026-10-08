export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && <p className="micro-label text-mauve">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-body sm:text-base">{description}</p>}
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
