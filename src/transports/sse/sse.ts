import { Streamable, TransformableReadableStream } from "../../utils/stream-utils.js";
import { parseEventStream } from "../../utils/event-stream-parser.js";
import { isNullOrUndefined } from "../../utils/utils.js";
import type { Transport } from "../../types/transport.js";

export type EventSourceCallback<T = unknown> = (
  this: EventSource,
  event: MessageEvent<T>
) => void;

export class SSETransport implements Transport {
  private eventSource: EventSource;
  private eventSourceMap = new Map<string, EventSourceCallback<unknown>>();
  constructor(
    private url: string,
    private options: {
      eventName: string;
      sseOptions?: EventSourceInit;
      onError?: (event: Event) => void;
      onOpen?: (event: Event) => void;
    }
  ) {
    this.eventSource = new EventSource(this.url, this.options.sseOptions);
    this.eventSource.onerror = options?.onError || null;
    this.eventSource.onopen = options?.onOpen || null;
  }

  addEventListener = <T>(
    eventName: string,
    cb: EventSourceCallback<T>,
    options?: AddEventListenerOptions
  ) => {
    this.eventSourceMap.set(eventName, cb as EventSourceCallback<unknown>);
    this.eventSource.addEventListener(eventName, cb, options);
    return () => {
      this.eventSource.removeEventListener(eventName, cb, options);
      this.eventSourceMap.delete(eventName);
    };
  };


  // Overload 1: User passes only data and options (use constructor url)
  send(
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<{
    response: Promise<Response>;
    readableStream: TransformableReadableStream<string> | null;
  }>;

  // Overload 2: User passes a URL too
  send(
    url: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<{
    response: Promise<Response>;
    readableStream: TransformableReadableStream<string> | null;
  }>;

  async send(
    urlOrData?: string | Record<string, unknown>,
    maybeData?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ) {

    let url: string;
    let data: Record<string, unknown> | undefined;

    if (typeof urlOrData === "string") {
      url = urlOrData;
      data = maybeData;
    } else {
      url = this.url;
      data = urlOrData;
      options = maybeData as Omit<RequestInit, "body">;
    }
    let removeListenerEvent: (() => void) | null = null;

    const streamble = new Streamable();
    const { controller, readableStream } =
      await streamble.getControllableReadableStream<string>();

    if (options?.signal) {
      const abortHandler = () => {
        controller?.close();
        options?.signal?.removeEventListener("abort", abortHandler);
        removeListenerEvent?.();
      };
      options?.signal?.addEventListener("abort", abortHandler);
    }

    removeListenerEvent = this.addEventListener<string>(
      this.options.eventName,
      (event: MessageEvent) => {
        const parsedChunks = parseEventStream<string>(event.data);
        for (const chunk of parsedChunks) {
          if (isNullOrUndefined(chunk)) {
            controller?.close();
            removeListenerEvent?.();
            break;
          }
          controller?.enqueue(chunk);
        }
      },
      {
        signal: options?.signal as AbortSignal,
      }
    );

    const response = fetch(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    return { response, readableStream: new TransformableReadableStream(readableStream) };
  };

  transportUrl = () => {
    return this.url
  };

  close = () => {
    this.eventSourceMap.forEach((value, key) => {
      this.eventSource.removeEventListener(key, value);
    });
    this.eventSourceMap.clear();
    this.eventSource.close();
  };
}
