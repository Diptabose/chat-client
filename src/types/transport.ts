export interface Transport {
  send(
    url?: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<{
    response: Promise<Response>;
    readableStream: ReadableStream<string> | null;
  }>;
  close(): void;
}
