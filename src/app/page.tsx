import { redirect } from "next/navigation";

// ponytail: next-intl middleware handles / → /{locale}, but a root page.tsx
// catches it first. Redirect to the default locale so the middleware routing
// picks up cleanly.
export default function RootPage() {
  redirect("/en");
}
