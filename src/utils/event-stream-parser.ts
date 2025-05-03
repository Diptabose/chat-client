export function* parseEventStream<T>(data: string) {
    const subChunks = data.split(/(?<=})\n\ndata: (?={)/);
    for (const subChunk of subChunks) {
      const payload = subChunk.replace(/^data: /, "");
      yield payload as T;
    }
  }
  