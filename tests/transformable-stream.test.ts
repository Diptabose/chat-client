import { describe, it, expect } from "vitest";
import {
  TransformableObjectReadableStream,
  TransformableReadableStream,
} from "../src/utils/stream-utils";

interface StreamObj {
  data: {
    text: string;
    context: "pdf";
  };
  readOn: string;
}

const sample: StreamObj = {
  data: {
    text: "Test",
    context: "docx",
  },
  readOn: "",
} as unknown as StreamObj;

const createStream = <T>(value: T, count = 1, delay = 0) =>
  new ReadableStream<T>({
    start(controller) {
      let i = 0;
      const interval = setInterval(() => {
        controller.enqueue(value);
        i++;
        if (i === count) {
          controller.close();
          clearInterval(interval);
        }
      }, delay);
    },
  });

describe("TransformableReadableStream", () => {
  it("returns the original ReadableStream", async () => {
    const rs = createStream("Hello world");
    const ts = new TransformableReadableStream(rs);
    const stream = ts.toStream();

    expect(stream).toBe(rs);
    expect(stream).toBeInstanceOf(ReadableStream);

    const { value } = await stream.getReader().read();
    expect(value).toBe("Hello world");
  });

  it("converts stream to async iterable", async () => {
    const rs = createStream("Hello world", 10, 10);
    const ts = new TransformableReadableStream(rs);

    let count = 0;
    for await (const chunk of ts.toAsyncIterable()) {
      expect(chunk).toBe("Hello world");
      count++;
    }
    expect(count).toBe(10);
  });

  it("converts stream to text", async () => {
    const rs = createStream("Hello world", 10, 10);
    const ts = new TransformableReadableStream(rs);
    const text = await ts.toText();
    expect(text).toBe("Hello world".repeat(10));
  });


  it("converts stream to array", async () => {
    const rs = createStream("Hello world", 10, 10);
    const ts = new TransformableReadableStream(rs);
    const streamedArray = await ts.toArray();
    expect(streamedArray).toEqual(Array.from({length:10}).fill("Hello world"));
  });

  it("streams objects as async iterable", async () => {
    const rs = createStream(sample, 10, 10);
    const ts = new TransformableReadableStream(rs);
    let count = 0;
    for await (const obj of ts.toAsyncIterable()) {
      expect(obj).toEqual(sample);
      count++;
    }
    expect(count).toBe(10);
  });

  it("streams valid objects from string encoded objects", async () => {
    const rs = createStream(`{"data":{"text":"test"}}`, 10, 10);
    const ts = new TransformableReadableStream(rs);
    const objTrs = ts.toReadableObjectStream();
    expect(objTrs).toBeInstanceOf(TransformableObjectReadableStream);
    const asyncIterObjStream = objTrs.toAsyncIterable();
    for await (let chunk of asyncIterObjStream) {
      expect(chunk).toEqual({ data: { text: "test" } });
    }
  });
});
