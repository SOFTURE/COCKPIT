// Log out on the Settings screen: auth's logout action behind the theme's button, so it matches the buttons beside it
// (auth's LogoutButton draws @softure-ai/ui's taller button and cannot be sized: SOFTURE/AI#1439). Works without JavaScript.
import { logoutAction } from "@softure-ai/auth/next";
import { Button } from "@softure-ai/theme-notion";

export interface SignOutFormProps {
  readonly label: string;
  readonly className?: string;
}

export function SignOutForm({ label, className }: SignOutFormProps) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="touch" className={className}>
        {label}
      </Button>
    </form>
  );
}
