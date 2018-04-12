const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
  const values = { $menuId: req.params.menuId};
  db.all(sql, values, (error, rows) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: rows});
    }
  });
});

const validateMenuItem = (req, res, next) => {
  const menuItemToCreate = req.body.menuItem;
  //console.log(menuItemToCreate);
  if (!menuItemToCreate.name || !menuItemToCreate.description || !menuItemToCreate.inventory || !menuItemToCreate.price) {
    return res.sendStatus(400);
  }
  next();
}

menuItemsRouter.post('/', validateMenuItem, (req, res, next) => {
  const menuItemToCreate = req.body.menuItem;
  //console.log(menuItemToCreate);
  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
      'VALUES ($name, $description, $inventory, $price, $menu_id)';
  const values = {
    $name: menuItemToCreate.name,
    $description: menuItemToCreate.description,
    $inventory: menuItemToCreate.inventory,
    $price: menuItemToCreate.price,
    $menu_id: req.params.menuId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
        (error, row) => {
          res.status(201).json({menuItem: row});
        });
    }
  });
});

menuItemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
  const menuItemToUpdate = req.body.menuItem;
  //console.log(menuItemToUpdate);
  //console.log(req.params);
  const sql = 'UPDATE MenuItem SET name = $name, description = $description, ' +
      'inventory = $inventory, price = $price ' +
      'WHERE id = $menuItemId';
  const values = {
    $name: menuItemToUpdate.name,
    $description: menuItemToUpdate.description,
    $inventory: menuItemToUpdate.inventory,
    $price: menuItemToUpdate.price,
    $menuItemId: req.params.menuItemId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`,
        (error, row) => {
          res.status(200).json({menuItem: row});
        });
    }
  });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemsRouter;
