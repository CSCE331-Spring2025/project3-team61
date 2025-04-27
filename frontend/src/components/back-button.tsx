import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

interface BackButtonProps {
  to: string;
  className?: string;
}

export default function BackButton({ to, className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.navigate({ to })}
      className={`p-2 hover:bg-gray-200 rounded-full ${className}`}
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
