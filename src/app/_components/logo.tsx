import Image from "next/image";
import { cn } from "../_lib/utils";

export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "mark";
}) {
  if (variant === "mark") {
    return (
      <div className={cn("relative h-8 w-8", className)}>
        <Image
          src="/icon-logo.png"
          alt="Fantasy Predict"
          fill
          className="object-contain block dark:hidden"
        />
        <Image
          src="/icon-logo-white.png"
          alt="Fantasy Predict"
          fill
          className="object-contain hidden dark:block"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-10 w-38", className)}>
      <Image
        src="/logos.png"
        alt="Fantasy Predict"
        fill
        className="object-contain block dark:hidden"
      />
      <Image
        src="/logos-white.png"
        alt="Fantasy Predict"
        fill
        className="object-contain hidden dark:block"
      />
    </div>
  );
}