import type { ErrorEvent } from "@sentry/nextjs";
/** Keep stack traces useful while discarding content, identity and request data. */
export function redactMonitoringEvent(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    level: event.level,
    platform: event.platform,
    release: event.release,
    environment: event.environment,
    exception: event.exception
      ? {
          values: event.exception.values?.map((value) => ({
            type: value.type,
            value: "Application error",
            stacktrace: {
              frames: value.stacktrace?.frames?.map((frame) => ({
                filename: frame.filename?.split("?")[0],
                function: frame.function,
                lineno: frame.lineno,
                colno: frame.colno,
                in_app: frame.in_app,
              })),
            },
          })),
        }
      : undefined,
  };
}
