const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter = express.Router();

const menuItemsRouter = require('./menu-items.js');

menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get("SELECT * FROM Menu WHERE id = $id", {$id: menuId}, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      req.menu = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({menus: rows});
    }
  });
});

const validateMenu = (req, res, next) => {
  const menuToCreate = req.body.menu;
  //console.log(menuToCreate);
  if (!menuToCreate.title) {
    return res.sendStatus(400);
  }
  next();
}

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  const menuToUpdate = req.body.menu;
  //console.log(menuToUpdate);
  db.run(`UPDATE Menu
    SET title=$title
    WHERE id=$id`,
  {
    $id: req.params.menuId,
    $title: menuToUpdate.title
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).json({menu: row});
    });
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  //console.log(req.params.menuId);
  db.get("SELECT * FROM MenuItem WHERE menu_id = $id", {$id: req.params.menuId}, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      return res.sendStatus(400);
    } else {
      db.run(`DELETE FROM Menu WHERE id = $id`,
      { $id: req.params.menuId},
      function(err) {
        if (err) {
          next(error);
        }
        res.sendStatus(204);
      });
    }
  });
});

menusRouter.post('/', validateMenu, (req, res, next) => {
  const menuToCreate = req.body.menu;
  //console.log(menuToCreate);
  db.run(`INSERT INTO Menu (title)
    VALUES ($title)`,
  {
    $title: menuToCreate.title
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({menu: row});
    });
  });
});

module.exports = menusRouter;
