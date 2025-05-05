import { Streamable } from "../src/utils/stream-utils.js";
import { describe, expect, it } from 'vitest'

describe("check the streambale class", ()=>{
  it("stream controller should be able to push into stream", async ()=>{
    const streamableInstance = new Streamable();
    const resource = await streamableInstance.getControllableReadableStream()
    expect(resource.controller).toBeInstanceOf(ReadableStreamDefaultController);
    expect(resource.readableStream).toBeInstanceOf(ReadableStream);
    resource.controller?.enqueue("test");
    const rs = resource.readableStream.getReader();
    const { done, value } = await rs.read();
    expect(value).toBe("test");
    resource.controller?.close();
    expect(done).toBe(false);
  })   
})
