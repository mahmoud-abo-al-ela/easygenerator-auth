export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <span className="size-8 animate-spin rounded-full border-3 border-line border-t-primary motion-reduce:animate-none" />
      <span className="sr-only">Checking your session</span>
    </div>
  );
}
