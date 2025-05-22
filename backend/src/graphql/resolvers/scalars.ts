import {
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
  Kind,
  ValueNode,
  GraphQLError,
} from "graphql";

const dateScalarConfig: GraphQLScalarTypeConfig<Date, number> = {
  name: "Date",
  description: "Date custom scalar type—serializes to milliseconds since epoch",

  serialize(value: unknown): number {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string") {
      // rehydrate the ISO string into a Date
      date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new TypeError(`Date.serialize cannot parse ISO string: ${value}`);
      }
    } else {
      throw new TypeError(
        `Date.serialize expected a Date or ISO‑string, received ${typeof value}`
      );
    }

    return date.getTime();
  },

  parseValue(value: unknown): Date {
    if (typeof value !== "number") {
      throw new TypeError(
        `Date.parseValue expected a number, received ${typeof value}`
      );
    }
    return new Date(value);
  },

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Date.parseLiteral expected an INT literal, got ${ast.kind}`
      );
    }
    return new Date(parseInt(ast.value, 10));
  },
};

export const dateScalar = new GraphQLScalarType(dateScalarConfig);

export default {
  Date: dateScalar,
};
