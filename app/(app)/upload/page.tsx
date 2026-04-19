import { UploadClient } from "./upload-client";

export const metadata = {
  title: "New deck · Mnemo",
};

export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">New deck</h1>
        <p className="text-sm text-zinc-500">
          Drop a PDF. We read it, then write flashcards you can edit before saving.
        </p>
      </div>
      <UploadClient />
    </div>
  );
}
