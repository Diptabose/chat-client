import { TransformableReadableStream } from "src/utils/stream-utils.js";

export interface Transport {
  send(
    url: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<{
    response: Promise<Response>;
    readableStream: TransformableReadableStream<string> | null;
  }>;

  transportUrl: () => string | URL,
  close(): void;
}
