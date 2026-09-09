import { z } from "zod"
import {
  parseArrayWithItemIsolation,
  parseWithSchema,
  reportedBoolean,
  reportedNumber,
  reportedString,
} from "@/lib/api/schema-coercion"
import { SchemaMismatchError } from "@/lib/api/schema-mismatch-error"
import { RecordingReporter } from "./test-helpers"

describe("schema-coercion", () => {
  let reporter: RecordingReporter

  beforeEach(() => {
    reporter = new RecordingReporter()
  })

  describe("reportedNumber", () => {
    it("passes a real number through without reporting", () => {
      const schema = reportedNumber({ endpoint: "e", field: "amount", reporter })
      expect(schema.parse(1500.5)).toBe(1500.5)
      expect(reporter.coercions).toHaveLength(0)
    })

    it("coerces a numeric string and reports coercion", () => {
      const schema = reportedNumber({ endpoint: "e", field: "amount", reporter })
      expect(schema.parse("1500.5")).toBe(1500.5)
      expect(reporter.coercions).toEqual(["amount"])
    })

    it("fails closed on a non-numeric value", () => {
      const schema = reportedNumber({ endpoint: "e", field: "amount", reporter })
      expect(() => schema.parse("not-a-number")).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe("reportedString", () => {
    it("passes a real string through without reporting", () => {
      const schema = reportedString({ endpoint: "e", field: "amount", reporter })
      expect(schema.parse("10.5")).toBe("10.5")
      expect(reporter.coercions).toHaveLength(0)
    })

    it("coerces a number and reports coercion", () => {
      const schema = reportedString({ endpoint: "e", field: "amount", reporter })
      expect(schema.parse(10.5)).toBe("10.5")
      expect(reporter.coercions).toEqual(["amount"])
    })

    it("fails closed on a Map/List-shaped value", () => {
      const schema = reportedString({ endpoint: "e", field: "amount", reporter })
      expect(() => schema.parse({ nested: true })).toThrow()
      expect(() => schema.parse([1, 2])).toThrow()
    })
  })

  describe("reportedBoolean", () => {
    it("passes a real boolean through without reporting", () => {
      const schema = reportedBoolean({ endpoint: "e", field: "flag", reporter })
      expect(schema.parse(true)).toBe(true)
      expect(reporter.coercions).toHaveLength(0)
    })

    it("coerces 0/1 and 'true'/'false' strings and reports coercion", () => {
      const schema = reportedBoolean({ endpoint: "e", field: "flag", reporter })
      expect(schema.parse(1)).toBe(true)
      expect(schema.parse(0)).toBe(false)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse("0")).toBe(false)
      expect(reporter.coercions).toHaveLength(4)
    })

    it("fails closed on an unrecognized value", () => {
      const schema = reportedBoolean({ endpoint: "e", field: "flag", reporter })
      expect(() => schema.parse("maybe")).toThrow()
      expect(() => schema.parse(2)).toThrow()
    })
  })

  describe("parseWithSchema", () => {
    const schema = z.object({
      amount: reportedNumber({ endpoint: "p2p/v1/orders", field: "amount", reporter: undefined }),
    })

    it("returns the parsed value on success", () => {
      const result = parseWithSchema(schema, { amount: 100 }, { endpoint: "p2p/v1/orders", reporter })
      expect(result.amount).toBe(100)
    })

    it("throws a SchemaMismatchError and reports it on failure", () => {
      expect(() =>
        parseWithSchema(schema, { amount: "not-a-number" }, { endpoint: "p2p/v1/orders", reporter }),
      ).toThrow(SchemaMismatchError)
      expect(reporter.mismatches).toHaveLength(1)
      expect(reporter.mismatches[0].endpoint).toBe("p2p/v1/orders")
      expect(reporter.mismatches[0].field).toBe("amount")
    })
  })

  describe("parseArrayWithItemIsolation", () => {
    const itemSchema = z.object({
      id: z.number(),
      exchange_rate: reportedNumber({ endpoint: "p2p/v1/adverts", field: "exchange_rate", reporter: undefined }),
    })

    it("keeps valid items and skips + reports bad ones by index", () => {
      const items = [
        { id: 101, exchange_rate: "1500.5" },
        { id: "not-an-id", exchange_rate: {} },
        { id: 103, exchange_rate: 1600 },
      ]

      const result = parseArrayWithItemIsolation(itemSchema, items, {
        endpoint: "p2p/v1/adverts",
        field: "data",
        reporter,
      })

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([101, 103])
      expect(reporter.mismatches).toHaveLength(1)
      expect(reporter.mismatches[0].itemIndex).toBe(1)
    })

    it("throws when every item in a non-empty list is rejected", () => {
      const items = [{ id: "bad" }, { id: "also-bad" }]
      expect(() =>
        parseArrayWithItemIsolation(itemSchema, items, { endpoint: "p2p/v1/adverts", field: "data", reporter }),
      ).toThrow(SchemaMismatchError)
    })

    it("returns an empty array for an empty list without throwing", () => {
      const result = parseArrayWithItemIsolation(itemSchema, [], {
        endpoint: "p2p/v1/adverts",
        field: "data",
        reporter,
      })
      expect(result).toEqual([])
    })
  })
})
