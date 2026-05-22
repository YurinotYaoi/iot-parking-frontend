type SpinnerProps = {
    size?: "sm" | "md" | "lg";
    label?: string; // accessible label, defaults to "Loading"
    className?: string;
  };
   
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-4",
  };
   
  export function Spinner({
    size = "md",
    label = "Loading",
    className = "",
  }: SpinnerProps) {
    return (
      <div role="status" className={`inline-flex items-center gap-2 ${className}`}>
        <span
          aria-hidden="true"
          className={`${sizeMap[size]} inline-block animate-spin rounded-full border-zinc-300 border-t-zinc-900`}
        />
        <span className="sr-only">{label}…</span>
      </div>
    );
  }
   