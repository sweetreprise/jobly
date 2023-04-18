"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();

// POST { Job } =>  { Job }
/* job should be { title, salary, equity, companyHandle }
*
* Returns { title, salary, equity, companyHandle }
*
* Authorization required: ADMIN
*/

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        console.log(errs)
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function(req, res, next) {
    const query = req.query;
    // convert string into number
    if(query.minSalary != undefined) query.minSalary = +query.minSalary;
    // convert string into boolean
    if(query.hasEquity === 'true') query.hasEquity = true;
    if(query.hasEquity === 'false') query.hasEquity = false;

    try {
        const validator = jsonschema.validate(query, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const jobs = await Job.findAll(query);
        return res.json({ jobs });
    } catch(err) {
        return next(err);
    }
})

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *   
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: ADMIN
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: ADMIN
 */
 
 router.delete("/:id", ensureAdmin, async function (req, res, next) {
   try {
     await Job.remove(req.params.id);
     return res.json({ deleted: req.params.id });
   } catch (err) {
     return next(err);
   }
 });

module.exports = router;

