import { describe, it, expect } from "vitest";
import { parseEventStream } from "../src/utils/event-stream-parser.js"




describe("event stream parser functionality", () => {

    it("should parse the normal stream text", () => {
        const dataText = `data: John Doe`;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(`John Doe`);
    })

    it("should parse the json stream text", () => {
        const dataText = `data: {'hello':'world}`;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(`{'hello':'world}`);
    })

    it("should parse the normal stream text when data prefix is missing", () => {
        const dataText = `John Doe`;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(`John Doe`);
    })

    it("should parse the json stream text when data prefix is missing", () => {
        const dataText = `{'hello':'world}`;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(`{'hello':'world}`);
    })

    it("should parse the json stream text when empty", () => {
        const dataText = ``;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(``);
    })

    it("should parse the nested json stream", () => {
        const dataText = `data: {'hello':{'test':'world'}}`;
        const iterable = parseEventStream(dataText);
        const parsedStream = iterable.next();
        expect(parsedStream.value).toBe(`{'hello':{'test':'world'}}`);
    })

    /**
     * TODO: Test what is happening if multiple spaces are sent in the stream. Test for \n, \t, \r etc...
     */
    // it("should parse the json stream text when data is empty", () => {
    //     const dataText = `data:     `;
    //     const iterable = parseEventStream(dataText);
    //     const parsedStream = iterable.next();
    //     expect(parsedStream.value).toBe(`    `);
    // })

})