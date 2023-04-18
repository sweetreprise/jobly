const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function() {
    test("works: 1 item", function() {
        const dataToUpdate = { firstName: "atlas" };
        const jsToSql = { firstName: "first_name" };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: `"first_name"=$1`,
            values: ["atlas"]
        });
    });

    test("works: 2 items", function() {
        const dataToUpdate = { firstName: "atlas", age: "29" };
        const jsToSql = { firstName: "first_name"};
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: `"first_name"=$1, "age"=$2`,
            values: ["atlas", "29"]
        });
    });
});