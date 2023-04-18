const { BadRequestError } = require("../expressError");

// Used to make PARTIAL database updates on user info
// dataToUpdate => an OBJECT { field: newData, field2: newData2... }
// jsToSql => an OBJECT that holds the field to be updated as the KEY
//            and the actual database field name as the VALUE
//            { firstName: 'first_name'... }

// returns an OBJECT 
// {
//  setCols: `"first_name"=$1, "age"=$2`,
//  values: ['Atlas', '29']
// }

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };


