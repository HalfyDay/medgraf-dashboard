import { NextRequest, NextResponse } from "next/server";

const encoder = new TextEncoder();

const formatEvent = (event: string, payload: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }

  let keepAliveTimer: NodeJS.Timeout | null = null;
  let mockNotificationsTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(formatEvent(event, payload)));
      };

      send("ready", { connected: true });

      keepAliveTimer = setInterval(() => send("keep-alive", { ts: Date.now() }), 20000);
      mockNotificationsTimer = setInterval(
        () =>
          send("notification", {
            id: Date.now(),
            title: "Сервисные события",
            body: "Это демонстрационный поток событий.",
            level: "info",
          }),
        45000,
      );

      const shutdown = () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        if (mockNotificationsTimer) {
          clearInterval(mockNotificationsTimer);
          mockNotificationsTimer = null;
        }
        controller.close();
      };

      req.signal.addEventListener("abort", shutdown, { once: true });
    },
    cancel() {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      if (mockNotificationsTimer) {
        clearInterval(mockNotificationsTimer);
        mockNotificationsTimer = null;
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-store",
    },
  });
}
