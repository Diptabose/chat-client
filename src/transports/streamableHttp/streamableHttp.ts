import type { Transport } from "../..//types/transport.js";
import {
  toDecodedReadableStream,
  TransformableReadableStream,
  transformSSEStream,
} from "../../utils/stream-utils.js";

export class StreambleHttpTransport implements Transport {

  private abortController: AbortController
  constructor(private url: string) {
    this.abortController = new AbortController();
  }

  send = async (
    url: string = this.url,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ) => {

    if (this.abortController.signal.aborted) {
      this.abortController = new AbortController();
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
          transformSSEStream()
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
