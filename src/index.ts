import { StreambleHttpTransport } from "./transports/streamableHttp/streamableHttp.js";



const trans = new StreambleHttpTransport('http://localhost:3001/stream');



(async () => {
    const x = await trans.send({ query: `hello` });

    const asyncStream = x.readableStream?.toAsyncIterable();


    if (asyncStream) {
        for await (let chunk of asyncStream) {
            console.log("The chunk is", chunk, `p${chunk}p`);
        }
    }
})()
