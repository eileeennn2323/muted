import FaceUnlock from "@/components/unlock/FaceUnlock";
import PinUnlock from "@/components/unlock/PinUnlock";

export default function UnlockPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm md:hidden">
        <FaceUnlock />
      </div>
      <div className="hidden w-full max-w-sm md:block">
        <PinUnlock />
      </div>
    </main>
  );
}
