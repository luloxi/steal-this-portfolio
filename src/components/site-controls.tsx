"use client";

import { LocaleToggle } from "@/components/locale-toggle";
import { LoginLink } from "@/components/logout-button";
import { ProfileMenu } from "@/components/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Fixed chrome, same screen corner on every page. Logged out: "Entrar".
 * Logged in: the profile photo, which opens the account menu.
 */
export function SiteControls({
  className,
  signedIn = false,
  image,
  name,
}: {
  className?: string;
  signedIn?: boolean;
  image?: string;
  name?: string;
}) {
  return (
    <div
      data-inline-editor="skip"
      className={cn(
        "fixed right-3 top-3 z-50 flex items-center gap-2 sm:right-5 sm:top-4",
        className,
      )}
    >
      <LocaleToggle />
      <ThemeToggle />
      {signedIn ? <ProfileMenu image={image} name={name} /> : <LoginLink />}
    </div>
  );
}
