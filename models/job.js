"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for Jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * */
    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ]
        )

        const job = result.rows[0]
        return job
    }

    /** Find all jobs.
    *
    * *OPTIONAL* Filters by: title, minSalary, hasEquity
    * Returns [{ title, salary, equity, companyHandle }, ...]
    * */

    static async findAll(searchTerms = {}) {
        let query = `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                    FROM jobs`

        // collect the SQL WHERE expressions in an array
        const whereExpressions = [];
        //  collect the query values
        const queryValues = [];
        
        const { title, minSalary, hasEquity } = searchTerms;
        
        // throw error if minSalary is less than 0
        if(minSalary <= 0) {
            throw new BadRequestError("Salary must be greater than 0!")
        }

        // if filters are used, push the value into the queryValues array
        // and push the corresponding SQL expression in the whereExpressions array
        if(minSalary != undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`)
        }
        if(hasEquity) {
            queryValues.push(0);
            whereExpressions.push(`equity > $${queryValues.length}`)
        }
        if(title) {
            queryValues.push(title);
            whereExpressions.push(`title ILIKE $${queryValues.length}`)
        }
        // connect original query with SQL keyword WHERE
        // + join the SQL expressions in whereExpressions with SQL keyword AND
        if (whereExpressions.length > 0) {
            query += ' WHERE ' + whereExpressions.join(" AND ");
        }
        // finalize query by adding an ORDER BY name and return results
        query += " ORDER BY title";
        const jobs = await db.query(query, queryValues)
        return jobs.rows;
    }

    // ** Given a job id, return data about the job
    static async get(id) {
        const jobRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);
    
        const job = jobRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job with id: ${id}`);
    
        return job;
    }

    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${handleVarIdx}
                        RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if(!job) throw new NotFoundError(`No job with ID: ${id}`);
        return job;
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
    static async remove(id) {
        const check = await db.query(
            `SELECT id
            FROM jobs
            WHERE id=$1`, [id]
        )

        const job = check.rows[0]
        if(!job) throw new NotFoundError(`No job with ID: ${id}`);

        await db.query(
            `DELETE
            FROM jobs
            WHERE id=$1
            RETURNING id`, [id]
        )
    }
}

module.exports = Job;