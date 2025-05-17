import { describe, it, expect } from "vitest";
import {
  TransformableObjectReadableStream,
} from "../src/utils/stream-utils";

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

describe("TranformableObjectReadableStream", () => {
  it("returns the original ReadableStream", async () => {
    const testSample = { data: { text: "test" } };
    const rs = createStream(testSample);
    const ts = new TransformableObjectReadableStream(rs);
    const stream = ts.toStream();
    expect(stream).toBe(rs);
    expect(stream).toBeInstanceOf(ReadableStream);
    const { value } = await stream.getReader().read();
    expect(value).toBe(testSample);
  });


  it("converts stream to async iterable", async () => {
    const testSample = { data: { text: "test" } };
    const rs = createStream(testSample, 10, 10);
    const ts = new TransformableObjectReadableStream(rs);
    let count = 0;
    for await (const chunk of ts.toAsyncIterable()) {
      expect(chunk).toBe(testSample);
      count++;
    }
    expect(count).toBe(10);
  });

  it("converts stream to array", async () => {
    const rs = createStream({ data: { text: "test" } }, 10, 10);
    const ts = new TransformableObjectReadableStream(rs);
    const streamedArray = await ts.toArray();
    expect(streamedArray).toEqual(Array.from({ length: 10 }).fill({ data: { text: "test" } }));
  });

});
