import { PageContainer } from "@/components/shop/page-header";

/**
 * Layout for the policy and information pages. The wording lives in each page's TSX file,
 * so editing a policy means editing plain text in app/<page>/page.tsx.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          {eyebrow && <p className="micro-label text-mauve">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-base leading-relaxed text-body sm:text-lg">{intro}</p>}
          {updated && <p className="mt-2 text-xs text-muted-ink">Last updated {updated}</p>}
        </header>
        <div className="space-y-8">{children}</div>
      </article>
    </PageContainer>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <div className="space-y-3 leading-relaxed text-body">{children}</div>
    </section>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-mauve">{children}</ul>;
}
