# 📦 Streaming Client Transport SDK

A TypeScript SDK for streaming server responses in various transport modes such as **WebSockets**, **Server-Sent Events (SSE)**, and **Streaming HTTP**. It provides a unified `Client` interface to simplify communication with backend systems that support streamable responses.

---

## ✨ Features

* 🔄 Unified streaming interface
* ⚙️ Pluggable transport layer (WebSocket, SSE, HTTP)
* 🧠 Support for object and text streaming
* ❌ Graceful abort & close handling
* 🔌 Easy transport switching

---

## 📦 Installation

```bash
npm install @your-org/stream-client
```

---

## 📐 TypeScript Types

```ts
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
```

---

## 🚀 Usage

### 1. Create a `Transport`

You can use one of the following transports:

* `WebSocketTransport`
* `SSETransport`
* `StreambleHttpTransport`

```ts
import { WebSocketTransport } from "@your-org/stream-client/transports/websocket";

const wsTransport = new WebSocketTransport("ws://localhost:4000", {
  eventName: "message",
});
```

---

### 2. Create a `Client`

```ts
import { Client } from "@your-org/stream-client";

const client = new Client(wsTransport, {
  stream: true,
  objectMode: false,
});
```

---

### 3. Send Request

```ts
const result = await client.send("/api/chat", { message: "hello" });

const reader = result.readableStream.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log("Chunk:", value);
}
```

---

## 🌐 Transports

### ✅ WebSocketTransport

* Listens for server-side events via WebSocket.
* Sends an HTTP POST to initiate the stream.

```ts
new WebSocketTransport("ws://localhost:4000", { eventName: "message" });
```

### ✅ SSETransport

* Uses `EventSource` to listen to SSE streams.

```ts
new SSETransport("/events", { eventName: "data" });
```

### ✅ StreambleHttpTransport

* Sends an HTTP POST and receives `text/event-stream` over `fetch()`.

```ts
new StreambleHttpTransport("/stream");
```

---

## 🔧 API Reference

### `Client`

```ts
new Client(transport: Transport, options: { stream: boolean, objectMode: boolean })
```

#### `send(url?: string, data?: object, options?: RequestInit)`

* Returns a response + stream object
* Respects `AbortSignal`

#### `transport(newTransport: Transport)`

* Dynamically switch transport at runtime

---

## 📤 Streaming Modes

| stream | objectMode | Output Type            |
| ------ | ---------- | ---------------------- |
| false  | -          | `ContentResponse`      |
| true   | false      | `StreamResponse`       |
| true   | true       | `ObjectStreamResponse` |

---

## ❌ Graceful Aborting

All transports support `AbortSignal` to cancel ongoing requests and close streams.

```ts
const controller = new AbortController();
client.send("/api", {}, { signal: controller.signal });
controller.abort();
```

---

## 🧪 Example

```ts
const transport = new SSETransport("/events", { eventName: "data" });
const client = new Client(transport, { stream: true, objectMode: false });

const { readableStream } = await client.send("/chat", { prompt: "hi" });
const reader = readableStream.getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log("Chunk:", value);
}
```

---

## 🛠️ Utilities Used

* `Streamable` - wraps `ReadableStream` with controller
* `TransformableReadableStream` - transforms stream data
* `parseEventStream` - parses SSE chunked data

---

## 🧩 Extending

You can build your own transport by implementing:

```ts
export interface Transport {
  send(
    url?: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ): Promise<{ response: Promise<Response>, readableStream: ReadableStream | null }>;

  close(): void;
}
```

---

## 🧾 License

MIT

---

## 👨‍💻 Author

Developed by \[Dipta Bose] — Contributions are welcome!
