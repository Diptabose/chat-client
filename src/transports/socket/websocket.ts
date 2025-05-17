import type { Transport } from "../../types/transport.js";
import { Streamable, TransformableReadableStream } from "../../utils/stream-utils.js";

type SocketPayload = { event: string; payload: unknown };
type SocketCallback<T extends SocketPayload> = (
  event: MessageEvent<T>
) => Promise<void>;

type SocketUserCallback = (data?: unknown) => void;

export class WebSocketTransport implements Transport {
  private socket: WebSocket;

  private socketEventMap = new Map<string, SocketCallback<SocketPayload>>();
  private socketEventCallbackMap = new Map<string, SocketUserCallback>();

  constructor(
    private url: string | URL,
    private options: {
      eventName: string;
      protocols?: string | string[];
      onError?: (event: Event) => void;
      onOpen?: (event: Event) => void;
    }
  ) {
    this.socket = new WebSocket(this.url, this.options?.protocols);
    this.socket.onopen = this.options?.onOpen || null;
    this.socket.onerror = this.options?.onError || null;
    this.socket.onclose = this.close;
  }

  addEventListener = <T extends SocketPayload>(
    eventName: string,
    cb: (data?: T["payload"]) => void,
    options?: AddEventListenerOptions
  ) => {
    this.socketEventCallbackMap.set(eventName, cb);

    const callBack = async (event: MessageEvent<T>) => {
      const eventData = JSON.parse(
        event.data as unknown as string
      ) as SocketPayload;
      const cb = this.socketEventCallbackMap.get(eventData.event);
      cb?.(eventData.payload as T["payload"]);
    };

    this.socketEventMap.set(
      eventName,
      callBack as SocketCallback<SocketPayload>
    );

    if (options?.signal) {
      const abortCallback = () => {
        this.socketEventMap.delete(eventName);
        this.socketEventCallbackMap.delete(eventName);
        this.socket.removeEventListener("message", callBack);
        options?.signal?.removeEventListener("abort", abortCallback);
        this.socket.send(JSON.stringify({ event: `${eventName}-close` }));
      };
      options.signal?.addEventListener("abort", abortCallback);
    }

    this.socket.addEventListener("message", callBack, options);
    return () => {
      this.socketEventMap.delete(eventName);
      this.socketEventCallbackMap.delete(eventName);
      this.socket.removeEventListener("message", callBack, options);
    };
  };

  send = async (
    url: string = this.url.toString(),
    data?: Record<string, unknown>,
    options?: Omit<RequestInit, "body">
  ) => {
    const streamble = new Streamable();
    const { controller, readableStream } =
      await streamble.getControllableReadableStream<string>();

    if (options?.signal) {
      const abortHandler = () => {
        console.log("Websocket abordeted at send");
        controller?.close();
        removeListener?.();
        options?.signal?.removeEventListener("abort", abortHandler);
      };
      options?.signal?.addEventListener("abort", abortHandler);
    }

    const removeListener = this.addEventListener(
      this.options?.eventName,
      (data) => {
        if (data === null || data === undefined) {
          controller?.close();
          return removeListener();
        }
        controller?.enqueue(JSON.stringify(data));
      }
    );

    const response = fetch(url, {
      method: "POST",
      ...options,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    return { response, readableStream: new TransformableReadableStream(readableStream) };
  };

  close = () => {
    this.socketEventMap.forEach((value) => {
      this.socket.removeEventListener("message", value);
    });
    this.socketEventMap.clear();
    this.socketEventCallbackMap.clear();
    this.socket.close();
  };
}
