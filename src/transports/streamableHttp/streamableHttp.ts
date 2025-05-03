import type { Transport } from "../..//types/transport.js";
import {
  toDecodedReadableStream,
  transformSSEStream,
} from "../../utils/stream-utils.js";

export class StreambleHttpTransport implements Transport {
  constructor(private url: string) {}

  send = async (
    url?: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ) => {
    const response = await fetch(url ?? this.url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (response.body) {
      return {
        response: Promise.resolve(response),
        readableStream: toDecodedReadableStream(response.body).pipeThrough(
          transformSSEStream()
        ),
      };
    }

    return { response: Promise.resolve(response), readableStream: null };
  };

  close = () => {
    // Use our own abort controller
  };
}
