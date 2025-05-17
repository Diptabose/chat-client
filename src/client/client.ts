import type { Transport } from "../types/transport.js";


export type StreamResponse = {
  response: Promise<Response>;
  readableStream: ReadableStream;
};

export type ObjectStreamResponse = {
  response: Promise<Response>;
  readableStream: ReadableStream<any>;
};

export type ContentResponse = {
  response: Promise<Response>;
  content: string;
};

export type SendReturnType<Options extends { stream: boolean; objectMode: boolean }> =
  Options["stream"] extends false
  ? ContentResponse
  : Options["objectMode"] extends true
  ? ObjectStreamResponse
  : StreamResponse;

export class Client<
  Options extends { stream: boolean; objectMode: boolean } = {
    objectMode: true;
    stream: true;
  }
> {
  constructor(private _transport: Transport, private _options: Options) { }

  transport = (transport: Transport) => {
    this._transport = transport;
  };

  send = async (
    url: string = this._transport.transportUrl().toString(),
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<SendReturnType<Options>> => {
    const { readableStream, response } = await this._transport.send(
      url,
      data,
      options
    );

    if (this._options?.stream) {
      if (this._options?.objectMode) {
        return {
          response,
          readableStream: readableStream?.toReadableObjectStream()?.toStream(),
        } as unknown as SendReturnType<Options>;
      }
      return { readableStream, response } as unknown as SendReturnType<Options>;
    }

    if (!this._options?.stream) {
      const chunks = await readableStream?.toArray();
      return {
        response,
        content: chunks?.join(" "),
      } as unknown as SendReturnType<Options>;
    }

    throw new Error("Invalid Client options");
  };
}
