import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Panel({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl p-6 md:p-8 ${
        dark ? "bg-[#2B2644] text-white" : "border border-black/5 bg-white shadow-sm"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Panel dark={accent} className="flex min-h-[140px] flex-col justify-between">
      <p className={`text-sm font-medium ${accent ? "text-white/60" : "text-black/60"}`}>{label}</p>
      <div>
        <p
          className={`text-3xl font-medium md:text-4xl ${accent ? "text-white" : "text-black"}`}
          style={{ letterSpacing: "-0.03em" }}
        >
          {value}
        </p>
        {hint && (
          <p className={`mt-1 text-sm ${accent ? "text-white/50" : "text-black/50"}`}>{hint}</p>
        )}
      </div>
    </Panel>
  );
}

export function PrimaryButton({
  children,
  className = "",
  size = "lg",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: "md" | "lg" | "xl" }) {
  const sizes = {
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-base md:text-lg",
    xl: "px-10 py-5 text-lg md:text-xl",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-3 rounded-full bg-black font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-8 py-4 text-base font-medium text-black transition-colors duration-200 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 md:text-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ActionTile({
  title,
  description,
  icon,
  onClick,
  disabled,
  variant = "light",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "light" | "dark";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-[180px] flex-col items-start justify-between rounded-2xl p-6 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[200px] md:p-8 ${
        variant === "dark"
          ? "bg-[#2B2644] text-white hover:bg-[#342d52]"
          : "border border-black/5 bg-white shadow-sm hover:border-black/10 hover:shadow-md"
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          variant === "dark" ? "bg-white/10 text-white" : "bg-black text-white"
        }`}
      >
        {icon}
      </span>
      <div>
        <p
          className={`text-xl font-medium md:text-2xl ${variant === "dark" ? "text-white" : "text-black"}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </p>
        <p className={`mt-2 text-sm leading-relaxed ${variant === "dark" ? "text-white/60" : "text-black/60"}`}>
          {description}
        </p>
      </div>
    </button>
  );
}

export function AmountInput({
  label,
  suffix = "USDC",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-medium text-black/60">{label}</span>
      <div className="relative">
        <input
          className="w-full rounded-2xl border border-black/10 bg-white px-6 py-5 pr-24 text-2xl font-medium text-black outline-none transition-colors focus:border-black/30 md:text-3xl"
          style={{ letterSpacing: "-0.02em" }}
          {...props}
        />
        <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-base font-medium text-black/40">
          {suffix}
        </span>
      </div>
    </label>
  );
}

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
    <header className="mb-8 md:mb-10">
      {eyebrow && <p className="mb-2 text-sm text-black/60">{eyebrow}</p>}
      <h1
        className="text-4xl font-medium leading-tight text-black md:text-5xl"
        style={{ letterSpacing: "-0.04em" }}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-black/60 md:text-lg">{description}</p>
      )}
    </header>
  );
}

export function AlertBanner({
  children,
  variant = "warning",
}: {
  children: ReactNode;
  variant?: "warning" | "error";
}) {
  const styles =
    variant === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm leading-relaxed md:text-base ${styles}`}>
      {children}
    </div>
  );
}
