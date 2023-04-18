"use strict";
"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("create", function() {
    const newJob = {
        title: "New",
        salary: 120000,
        equity: '0.2',
        companyHandle: "c1"
    }

    test("works", async function(){
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: job.id,
            title: "New",
            salary: 120000,
            equity: '0.2',
            companyHandle: "c1"
        })

        const result = await db.query(`
        SELECT id, title, salary, equity, company_handle
        FROM jobs 
        WHERE title = 'New'`);
        expect(result.rows).toEqual([
            {   
                id: job.id,
                title: "New",
                salary: 120000,
                equity: '0.2',
                company_handle: "c1"
            }
        ]);
    });
});

/************************************** findAll */
describe("findAll", function () {
    test("works: no filter", async function(){
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {   
                id: testJobIds[0],
                title: 'Job1',
                salary: 100,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: testJobIds[1],
                title: 'Job2',
                salary: 200,
                equity: '0.2',
                companyHandle: 'c1'
            },
            {
                id: testJobIds[2],
                title: 'Job3',
                salary: 300,
                equity: '0',
                companyHandle: 'c1'
            },
            {
                id: testJobIds[3],
                title: 'Job4',
                salary: null,
                equity: null,
                companyHandle:'c1'
            }
        ]);
    });

    test("works: minSalary", async function() {
        let jobs = await Job.findAll({ minSalary: 300 })
        expect(jobs).toEqual([
            {
                id: testJobIds[2],
                title: 'Job3',
                salary: 300,
                equity: '0',
                companyHandle: 'c1'
            }
        ])
    })

    test("works: hasEquity", async function() {
        let jobs = await Job.findAll({ hasEquity: true })
        expect(jobs).toEqual([
            {   
                id: testJobIds[0],
                title: 'Job1',
                salary: 100,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: testJobIds[1],
                title: 'Job2',
                salary: 200,
                equity: '0.2',
                companyHandle: 'c1'
            }
        ])
    })

    test("works: title", async function() {
        let jobs = await Job.findAll({ title: "Job1"})
        expect(jobs).toEqual([
            {   
                id: testJobIds[0],
                title: 'Job1',
                salary: 100,
                equity: '0.1',
                companyHandle: 'c1'
            }
        ])
    })

    test("works: multiple filters", async function() {
        let jobs = await Job.findAll({ minSalary: 200, hasEquity: true })
        expect(jobs).toEqual([
            {
                id: testJobIds[1],
                title: 'Job2',
                salary: 200,
                equity: '0.2',
                companyHandle: 'c1'
            }
        ])
    })
});

/************************************** GET /:id */

describe("get", function () {
    test("works", async function () {
      let job = await Job.get(testJobIds[0]);
      expect(job).toEqual({   
        id: testJobIds[0],
        title: 'Job1',
        salary: 100,
        equity: '0.1',
        companyHandle: 'c1'
    });
    });
  
    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
          } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
          }
    });
  });

/************************************** update */

describe("update", function() {
    const updateData = {
        title: 'New',
        salary: 120,
        equity: "0.2",
        companyHandle: 'c1'
    }

    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
          id: testJobIds[0],
          ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = $1`, [testJobIds[0]]);

        expect(result.rows).toEqual([{
            id: testJobIds[0],
            title: 'New',
            salary: 120,
            equity: "0.2",
            company_handle: 'c1'
        }]);
    })

    test("works: null fields", async function () {
        const updateDataSetNulls = {
          title: "New",
          salary: null,
          equity: null,
          companyHandle: 'c1',
        };
    
        let job = await Job.update(testJobIds[0], updateDataSetNulls);
        expect(job).toEqual({
          id: testJobIds[0],
          ...updateDataSetNulls,
        });
    
        const result = await db.query(
              `SELECT id, title, salary, equity, company_handle
               FROM jobs
               WHERE id = $1`, [testJobIds[0]]);
        expect(result.rows).toEqual([{
          id: testJobIds[0],
          title: "New",
          salary: null,
          equity: null,
          company_handle: 'c1'
        }]);
    });

    test("not found if no such job", async function () {
        try {
          await Job.update(0, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
    
      test("bad request with no data", async function () {
        try {
          await Job.update(testJobIds[0], {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
})

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
      await Job.remove(testJobIds[0]);
      const res = await db.query(
          "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such company", async function () {
      try {
        await Job.remove(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });

