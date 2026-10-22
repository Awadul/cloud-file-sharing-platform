import { redactMonitoringEvent } from "./lib/monitoring";
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      defaultIntegrations: false,
      integrations: [Sentry.globalHandlersIntegration()],
      tracesSampleRate: 0,
      beforeSend: redactMonitoringEvent,
    });
  });
}
