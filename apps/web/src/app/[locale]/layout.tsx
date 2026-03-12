import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "Media Editor",
  description: "A Canva-like open-source media editor",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors closeButton theme="dark" />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
