import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/shop/page-header";
import { safeCallbackUrl } from "@/lib/session";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <PageHeader eyebrow="Welcome back" title="Log in" />
      <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_16px_40px_rgba(53,25,41,0.06)] sm:p-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-blush" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const raw = (await searchParams).callbackUrl;
  return <LoginForm callbackUrl={safeCallbackUrl(Array.isArray(raw) ? raw[0] : raw)} />;
}
