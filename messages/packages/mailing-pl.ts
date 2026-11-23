// Polish copy of @softure-ai/mailing (the mail footer and the unsubscribe page), every key of its English one.
import type { MailingMessages } from "@softure-ai/mailing";

export const mailingPl: MailingMessages = {
  errors: {
    mailing: {
      invalid_input: "Tej wiadomości nie można wysłać. Sprawdź adres i spróbuj ponownie.",
      rejected: "Usługa pocztowa odrzuciła tę wiadomość.",
      unavailable: "Usługa pocztowa nie odpowiada. Spróbuj ponownie za chwilę.",
      suppressed: "Ten adres wypisał się z tych wiadomości, więc nic nie wysłano.",
      provider_refused: "Usługa pocztowa odrzuciła nasze konto, więc nic nie wysłano. Musimy to naprawić po naszej stronie.",
      quota_exceeded: "Osiągnęliśmy na razie limit wysyłki. Spróbuj ponownie później.",
      delivery_in_flight: "Ta wiadomość jest właśnie wysyłana.",
      delivery_uncertain: "Ta wiadomość mogła już zostać wysłana. Sprawdź, zanim wyślesz ją ponownie.",
    },
  },
  footer: {
    text: "Nie chcesz tych wiadomości? Wypisz się tutaj:",
    htmlLead: "Nie chcesz tych wiadomości?",
    htmlLink: "Wypisz się",
  },
  unsubscribe: {
    title: "Wypisz się",
    lead: "Przestaniesz dostawać od nas te wiadomości. Wiadomości o Twoim koncie, takie jak reset hasła, nadal będą przychodzić.",
    submit: "Wypisz mnie",
    doneTitle: "Wypisano Cię",
    doneBody: "Nie będziemy już wysyłać Ci tych wiadomości.",
    invalidTitle: "Ten link nie działa",
    invalidBody: "Otwórz link z wiadomości jeszcze raz, w całości. Jeśli nadal nie działa, odpowiedz na wiadomość i poproś, żebyśmy przestali.",
    failed: "Nie udało się tego zapisać. Spróbuj ponownie za chwilę.",
  },
};
