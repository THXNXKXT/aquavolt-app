import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: `${t("name")} - ${t("tagline")}`,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "th")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <AuthGuard>
          <NavWrapper>
            <ErrorBoundary>{children}</ErrorBoundary>
          </NavWrapper>
        </AuthGuard>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
