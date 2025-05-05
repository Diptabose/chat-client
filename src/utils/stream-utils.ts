export function toDecodedReadableStream(reader: ReadableStream<Uint8Array>) {
  const readerInstance = reader.getReader();
  const decoder = new TextDecoder();
  return new ReadableStream<string>({
    async pull(controller) {
      const { value, done } = await readerInstance.read();
      const decodedChunk = decoder.decode(value, { stream: true });
      if (done) {
        controller.close();
      }
      controller.enqueue(decodedChunk);
    },
  });
}

export class Streamable {
  getControllableReadableStream<T>(): Promise<{
    controller: ReadableStreamDefaultController<T> | null;
    readableStream: ReadableStream<T>;
  }> {
    return new Promise((res, rej) => {
      let controllerReference: ReadableStreamDefaultController<T> | null = null;
      const readableStream = new ReadableStream({
        start(controller) {
          controllerReference = controller;
        },
      });
      res({ controller: controllerReference, readableStream });
    });
  }
}

export function transformSSEStream() {
  return new TransformStream<string, string>({
    transform: (chunk, controller) => {
      const subChunks = chunk.split(/(?<=})\n\ndata: (?={)/);
      for (const subChunk of subChunks) {
        const payload = subChunk.replace(/^data: /, "");
        controller.enqueue(payload);
      }
    },
  });
}

export function toObjectStream<P, T>() {
  return new TransformStream<P, T>({
    transform: (chunk, controller) => {
      controller.enqueue(JSON.parse(chunk as string));
    },
  });
}

export class TransformableReadableStream<T extends unknown> {
  constructor(private readableStream: ReadableStream<T>) { }

  /**
   * @description The default readable stream output.
   * @returns the original readable stream
   */
  toReadableStream = (): ReadableStream<T> => {
    return this.readableStream;
  };

  /**
   * @description Converts a string-encoded object stream to a typed object stream.
   * @returns A new TransformableReadableStream of objects
   */
  toReadableObjectStream = <TObj extends Record<string, unknown>>(): TransformableReadableStream<TObj> => {
    const transformedStream = this.readableStream.pipeThrough(
      toObjectStream<T, TObj>()
    );
    return new TransformableReadableStream<TObj>(transformedStream);
  };

  /**
   * @description Converts the entire stream to text. This locks the stream.
   * @returns The full string content of the stream.
   */
  toText = async (): Promise<string> => {
    let text = "";
    const reader = this.readableStream.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += value;
    }
    return text;
  };

  /**
   * @description Transforms the stream into a stream of string values for a specific object key.
   * @param readOn The key to extract from each object
   * @returns A new TransformableReadableStream of string values
   */
  toReadableObjectTextStream = (
    readOn: string
  ): TransformableReadableStream<string> => {
    const transformStream = new TransformStream<string, string>({
      transform: (chunk, controller) => {
        const obj = JSON.parse(chunk);
        controller.enqueue(obj[readOn]);
      },
    });

    const newStream = (
      this.readableStream as ReadableStream<string>
    ).pipeThrough(transformStream);
    return new TransformableReadableStream<string>(newStream);
  };

  /**
   * @description Turns the stream into an async iterable.
   * @returns An async generator yielding stream chunks
   */
  async *toAsyncIterable(): AsyncGenerator<T> {
    const reader = this.readableStream.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      yield value;
    }
  }
}