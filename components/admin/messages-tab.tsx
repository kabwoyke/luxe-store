"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { contactMessages } from "@/db/schema";
import { api, type Serialized } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { formatOrderDate } from "@/components/orders/order-parts";
import { ErrorNote, Loading } from "./ui";

type Message = Serialized<typeof contactMessages.$inferSelect>;

export function MessagesTab() {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: () => api<{ messages: Message[] }>("/api/admin/messages"),
  });

  const mark = useMutation({
    mutationFn: ({ id, handled }: { id: number; handled: boolean }) =>
      api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ handled }) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the message."),
  });

  if (error) return <ErrorNote error={error} />;
  if (isPending) return <Loading label="Loading messages" />;

  const open = data.messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-body" aria-live="polite">
        {open === 0 ? "No messages waiting." : `${open} ${open === 1 ? "message" : "messages"} waiting for a reply.`}
      </p>
      {data.messages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center text-sm text-body">
          Messages from the contact form will appear here.
        </div>
      ) : (
        <ul className="space-y-3">
          {data.messages.map((m) => (
            <li key={m.id} className={cn("rounded-3xl border bg-white p-5", m.handled ? "border-border bg-page" : "border-mauve/40")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-sm text-body">
                    <a href={`mailto:${m.email}`} className="text-mauve hover:text-mauve-dark">
                      {m.email}
                    </a>
                    {m.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${m.phone}`} className="text-mauve hover:text-mauve-dark">
                          {m.phone}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-ink">{formatOrderDate(new Date(m.createdAt))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => mark.mutate({ id: m.id, handled: !m.handled })}
                  className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold text-ink hover:border-mauve hover:text-mauve"
                >
                  {m.handled ? "Reopen" : "Mark handled"}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-body">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
