// How invitations reach a teammate (FR-16): in production auth's invitation mail goes out through the mailing module
// (Resend, MAIL_FROM); elsewhere the link is printed to the server console. A failed send leaves the invitation
// pending ("not sent") and Settings → Team offers Resend. Every send is logged with its outcome and the roles, never
// the address or the link (a live credential).
import { consoleInvitationSender, type InvitationSender } from "@softure-ai/auth";
import { mailingInvitationSender } from "@softure-ai/auth/mailing";
import { createLogger } from "@softure-ai/observability";

const logger = createLogger("team");

/** Wraps a sender so each send leaves a log line; a failure is logged and thrown on, as auth expects. */
export function withInvitationLog(send: InvitationSender): InvitationSender {
  return async (link, recipient, details) => {
    try {
      await send(link, recipient, details);
      logger.info("invitation sent", { roles: [...details.roles] });
    } catch (error) {
      // The mailing sender's error names a `mailing.*` code, never the address or the link.
      logger.error("invitation send failed", { roles: [...details.roles], error });
      throw error;
    }
  };
}

/** The invitation sender for `NODE_ENV`: mail in production, the console otherwise. */
export function getInvitationSender(nodeEnv: string | undefined): InvitationSender {
  return withInvitationLog(nodeEnv === "production" ? mailingInvitationSender() : consoleInvitationSender);
}
