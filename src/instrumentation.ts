export async function register() {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  const { redactMonitoringEvent } = await import("./lib/monitoring");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    beforeSend: redactMonitoringEvent,
  });
}
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
