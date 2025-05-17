import type { Transport } from "../..//types/transport.js";
import {
  toDecodedReadableStream,
  TransformableReadableStream,
  transformSSEStream,
  transformSSEStreams,
} from "../../utils/stream-utils.js";
import { EventSourceParserStream } from "eventsource-parser/stream";


export class StreambleHttpTransport implements Transport {

  private abortController: AbortController
  constructor(private url: string) {
    this.abortController = new AbortController();
  }

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

    if (this.abortController.signal.aborted) {
      this.abortController = new AbortController();
    }

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

    const response = await fetch(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...options?.headers,
      },
      signal: options?.signal ?? this.abortController.signal
    });

    if (response.body) {
      return {
        response: Promise.resolve(response),
        readableStream: new TransformableReadableStream(toDecodedReadableStream(response.body).pipeThrough(
          transformSSEStreams()
        )),
      };
    }

    return { response: Promise.resolve(response), readableStream: null };
  };

  transportUrl = () => {
    return this.url;
  };

  close = () => {
    // Use our own abort controller
    this.abortController.abort();
  };
}