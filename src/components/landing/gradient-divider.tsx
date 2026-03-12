export function GradientDivider() {
  return (
    <div
      className="mx-auto h-px w-full max-w-md"
      style={{
        background:
          "linear-gradient(to right, transparent, var(--primary), transparent)",
      }}
    />
  );
}
