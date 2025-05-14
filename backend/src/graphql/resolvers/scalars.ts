import {
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
  Kind,
  ValueNode,
  GraphQLError,
} from "graphql";

const dateScalarConfig: GraphQLScalarTypeConfig<Date, number> = {
  name: "Date",
  description: "Date custom scalar type",

  serialize(value: unknown): number {
    if (!(value instanceof Date)) {
      throw new TypeError(
        `Date.serialize expected a Date object, received ${typeof value}`
      );
    }
    return value.getTime();
  },

  parseValue(value: unknown): Date {
    if (typeof value !== "number") {
      throw new TypeError(
        `Date.parseValue expected a number, received ${typeof value}`
      );
    }
    return new Date(value);
  },

  // ! must return Date
  parseLiteral(ast: ValueNode): Date {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Date.parseLiteral expected an INT literal, got ${ast.kind}`
      );
    }
    return new Date(parseInt(ast.value, 10));
  },
};

const dateScalar = new GraphQLScalarType(dateScalarConfig);

const resolvers = {
  Date: dateScalar,
};

export default resolvers;

// import { GraphQLScalarType, Kind } from "graphql";

// const dateScalar = new GraphQLScalarType({
//   name: "Date",
//   description: "Date custom scalar type",
//   serialize(value: any) {
//     return value.getTime(); // Convert outgoing Date to integer for JSON
//   },
//   parseValue(value: any) {
//     return new Date(value); // Convert incoming integer to Date
//   },
//   parseLiteral(ast) {
//     if (ast.kind === Kind.INT) {
//       return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
//     }
//     return null; // Invalid hard-coded value (not an integer)
//   },
// });

// const resolvers = {
//   Date: dateScalar,
// };

// export default resolvers;
