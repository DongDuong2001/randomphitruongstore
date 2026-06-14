"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/lib/constants";

const contactSchema = z.object({
  name: z.string().trim().min(2),
  message: z.string().trim().min(5)
});
type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm({
  labels
}: {
  labels: { name: string; message: string; send: string };
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  function submit(values: ContactValues) {
    const subject = encodeURIComponent(
      `Website contact from ${values.name}`
    );
    const body = encodeURIComponent(
      `Name: ${values.name}\n\nMessage:\n${values.message}`
    );
    window.open(
      `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`,
      "_self",
      "noopener,noreferrer"
    );
  }

  return (
    <form
      className="min-w-0 border border-black/20 bg-white p-5 shadow-[8px_8px_0_rgba(17,16,14,0.08)] sm:p-8 lg:p-10"
      onSubmit={handleSubmit(submit)}
    >
      <div className="grid min-w-0 gap-6">
      <label className="block min-w-0">
        <span className="label">{labels.name}</span>
        <input
          autoComplete="name"
          className="field min-w-0"
          {...register("name")}
        />
        {errors.name ? <span className="error-text">Required</span> : null}
      </label>
      <label className="block min-w-0">
        <span className="label">{labels.message}</span>
        <textarea
          className="field min-h-40 min-w-0 resize-y"
          {...register("message")}
        />
        {errors.message ? <span className="error-text">Required</span> : null}
      </label>
      <button className="button-primary w-full sm:w-fit" type="submit">
        <Send aria-hidden="true" size={16} />
        {labels.send}
      </button>
      </div>
    </form>
  );
}
