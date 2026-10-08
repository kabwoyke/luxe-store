"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, signup } from "@/app/actions/auth";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/schemas/auth";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-mauve focus:outline-none";
const submit =
  "h-12 w-full rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-hover disabled:opacity-60";

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-body">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await login(values);
    if (!result.ok) return setFormError(result.error);
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" id="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" className={field} {...register("email")} />
      </Field>
      <Field label="Password" id="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={field}
          {...register("password")}
        />
      </Field>
      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-body">
        New here?{" "}
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-mauve hover:text-mauve-dark"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    const result = await signup(values);
    if (!result.ok) return setFormError(result.error);
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" id="firstName" error={errors.firstName?.message}>
          <input id="firstName" autoComplete="given-name" className={field} {...register("firstName")} />
        </Field>
        <Field label="Last name" id="lastName" error={errors.lastName?.message}>
          <input id="lastName" autoComplete="family-name" className={field} {...register("lastName")} />
        </Field>
      </div>
      <Field label="Email" id="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" className={field} {...register("email")} />
      </Field>
      <Field label="Password (at least 8 characters)" id="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={field}
          {...register("password")}
        />
      </Field>
      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={submit}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-body">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-mauve hover:text-mauve-dark"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
