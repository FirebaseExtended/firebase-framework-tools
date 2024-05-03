"use client";

export function RegenerateButton() {
  async function revalidate() {
    await fetch("/isr/demand/revalidate", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      type="button"
      className="button regenerate-button"
      onClick={() => revalidate()}
    >
      Regenerate page
    </button>
  );
}
