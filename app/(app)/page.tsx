import { redirect } from "next/navigation";
import { LANDING_PATH } from "../../softure.config.ts";

export default function HomePage(): never {
  redirect(LANDING_PATH);
}
