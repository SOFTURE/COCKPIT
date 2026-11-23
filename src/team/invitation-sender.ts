// How invitations reach a teammate (FR-16): in production auth's invitation mail goes out through the mailing module
// (Resend, MAIL_FROM); elsewhere the link is printed to the server console. A failed send leaves the invitation
// pending ("not sent") and Settings → Team offers Resend.
import { consoleInvitationSender, type InvitationSender } from "@softure-ai/auth";
import { mailingInvitationSender } from "@softure-ai/auth/mailing";

/** The invitation sender for `NODE_ENV`: mail in production, the console otherwise. */
export function getInvitationSender(nodeEnv: string | undefined): InvitationSender {
  return nodeEnv === "production" ? mailingInvitationSender() : consoleInvitationSender;
}
