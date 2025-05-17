import { TransformableReadableStream } from "./src/utils/stream-utils";

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

async function check() {
  try {
    const rs = createStream(`{"data":{"text":"test"}}`, 10, 10);
    const ts = new TransformableReadableStream(rs);
    const objTrs = ts.toReadableObjectStream();

    const asyncIterObjStream = objTrs.toAsyncIterable();

    for await (let chunk of asyncIterObjStream) {
      console.log("The chunk is", chunk, typeof chunk);
    }
  } catch (err) {
    console.log("The error is", err);
  }
}

check();
