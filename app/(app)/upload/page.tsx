import { UploadClient } from "./upload-client";

export const metadata = {
  title: "New deck · Mnemo",
};

export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <UploadClient />
    </div>
  );
}
