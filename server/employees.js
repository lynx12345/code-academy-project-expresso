const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter = express.Router();

const timesheetRouter = require('./timesheets.js');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get("SELECT * FROM Employee WHERE id = $id", {$id: employeeId}, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      req.employee = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1 ', (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({employees: rows});
    }
  });
});

const validateEmployee = (req, res, next) => {
  const employeeToCreate = req.body.employee;
  if (!employeeToCreate.name || !employeeToCreate.position || !employeeToCreate.wage) {
    return res.sendStatus(400);
  }
  next();
}

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
  const employeeToUpdate = req.body.employee;
  db.run(`UPDATE Employee
    SET name=$name,
    position=$position,
    wage=$wage
    WHERE id=$id`,
  {
    $id: req.params.employeeId,
    $name: employeeToUpdate.name,
    $position: employeeToUpdate.position,
    $wage: employeeToUpdate.wage
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).json({employee: row});
    });
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(`UPDATE Employee
    SET is_current_employee=0
    WHERE id=$id`,
  {$id: req.params.employeeId},
  function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).json({employee: row});
    });
  });
});

employeesRouter.post('/', validateEmployee, (req, res, next) => {
  const employeeToCreate = req.body.employee;
  //console.log(employeeToCreate);
  db.run(`INSERT INTO Employee (name, position, wage)
    VALUES ($name, $position, $wage)`,
  {
    $name: employeeToCreate.name,
    $position: employeeToCreate.position,
    $wage: employeeToCreate.wage
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({employee: row});
    });
  });
});

module.exports = employeesRouter;
