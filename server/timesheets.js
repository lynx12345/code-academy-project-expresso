const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, issue) => {
    if (error) {
      next(error);
    } else if (issue) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
  const values = { $employeeId: req.params.employeeId};
  db.all(sql, values, (error, rows) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: rows});
    }
  });
});

const validateTimesheet = (req, res, next) => {
  const timesheetToCreate = req.body.timesheet;
  if (!timesheetToCreate.hours || !timesheetToCreate.rate || !timesheetToCreate.date) {
    return res.sendStatus(400);
  }
  next();
}

timesheetRouter.post('/', validateTimesheet, (req, res, next) => {
  const timesheetToCreate = req.body.timesheet;
  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
      'VALUES ($hours, $rate, $date, $employee_id)';
  const values = {
    $hours: timesheetToCreate.hours,
    $rate: timesheetToCreate.rate,
    $date: timesheetToCreate.date,
    $employee_id: req.params.employeeId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
        (error, row) => {
          res.status(201).json({timesheet: row});
        });
    }
  });

});

timesheetRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
    const timesheetToUpdate = req.body.timesheet;
    const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, ' +
        'date = $date, employee_id = $employee_id ' +
        'WHERE id = $timesheetId';
    const values = {
      $hours: timesheetToUpdate.hours,
      $rate: timesheetToUpdate.rate,
      $date: timesheetToUpdate.date,
      $employee_id: req.params.employeeId,
      $timesheetId: req.params.timesheetId
    };

    db.run(sql, values, function(error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`,
          (error, row) => {
            res.status(200).json({timesheet: row});
          });
      }
    });
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetRouter;
