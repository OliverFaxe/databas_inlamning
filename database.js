const Database = require("better-sqlite3");

const db = new Database("TechGearWebShop.db");

const checkPrice = (price) => {
  if (price <= 0) {
    throw new Error("Priset måste vara större än 0");
  }
};

const checkEmail = (email) => {
  const emailRegularExpression =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegularExpression.test(email); // returnerar ett boolean om regular expression finns i email.
};

const checkProductName = (name) => {
  if (!name || name.trim().length === 0) {
    throw new Error("Produktnamnet får inte vara tomt");
  }
};

// 1

function showProducts(sort) {
  try {
    // Ursprungliga queryn som läggs till nedanför med en sort för utökad sortering
    let query = `
      SELECT products.product_id AS ID,
      products.name AS Products,
      products.price AS Price,
      products.description AS Description,
      products.stock_quantity AS Stock,
      categories.name AS Category,
      manufacturers.name AS Manufacturer
      FROM products
      LEFT JOIN products_categories ON products.product_id=products_categories.product_id
      LEFT JOIN manufacturers ON products.manufacturer_id =manufacturers.manufacturer_id
      LEFT JOIN categories ON products_categories.category_id=categories.category_id
    `;
    // Sortering baserat på vad man skriver i sort parametern + stänger queryn
    if (sort === "price_asc") {
      query += "ORDER BY products.price ASC;";
    } else if (sort === "price_desc") {
      query += "ORDER BY products.price DESC;";
    }

    // Ifall man inte använder sig av sort och stänger queryn
    if (!sort) {
      query += ";";
    }

    const stmt = db.prepare(query); //Den klara queryn med eller utan en sort
    const info = stmt.all(); // Hämtar alla rader från tabellen
    return info; // Returnerar resultatet så det kan användas i server.js
  } catch (error) {
    console.log(`Could not show table`, error.message);
    return;
  }
}

// 2

function showProductByID(id) {
  try {
    const stmt = db.prepare(`
        SELECT products.name AS Products,
        products.price AS Price,
        products.description AS Description,
        products.stock_quantity AS Stock,
        categories.name AS Category,
        manufacturers.name AS Manufacturer
        FROM products
        LEFT JOIN products_categories ON products.product_id = products_categories.product_id
        LEFT JOIN manufacturers ON products.manufacturer_id = manufacturers.manufacturer_id
        LEFT JOIN categories ON products_categories.category_id = categories.category_id 
        WHERE products.product_id = ?;
        `);
    const product = stmt.get(id);
    return product;
  } catch (error) {
    console.log(`Could not show products with ID ${id}`, error.message);
    return null;
  }
}

// 3

function showProductsByName(searchterm) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM products
      WHERE name LIKE ?;
      `);
    const products = stmt.all(`%${searchterm}%`); // stmt.all fetch multiple rows
    return products;
  } catch (error) {
    console.error("Error fetching products:", error.message);
  }
}

// 4
function showProductsInCategory(id) {
  try {
    const stmt = db.prepare(`
      SELECT products.name AS Products,
      products.price AS Price,
      products.description AS Description,
      products.stock_quantity AS Stock,
      categories.name AS Category,
      manufacturers.name AS Manufacturer
      FROM products
      LEFT JOIN products_categories ON products.product_id = products_categories.product_id
      LEFT JOIN manufacturers ON products.manufacturer_id = manufacturers.manufacturer_id
      LEFT JOIN categories ON products_categories.category_id = categories.category_id 
      WHERE products_categories.category_id = ?
      `);
    const products = stmt.all(`${id}`);
    return products;
  } catch (error) {
    return error;
  }
}

// 5
function createProduct(product) {
  try {
    const stmt = db.prepare(`
      INSERT INTO products (manufacturer_id, name, description, price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Extract individual values from the product object
    const result = stmt.run(
      product.manufacturer_id,
      product.name,
      product.description,
      product.price,
      product.stock_quantity
    );

    return result;
  } catch (error) {
    console.error("Error creating product:", error.message);
    return null;
  }
}

// 6
function updateProduct(updatedProduct, id) {
  try {
    const stmt = db.prepare(`UPDATE products
      SET manufacturer_id = ?,
      name = ?,
      description = ?,
      price = ?,
      stock_quantity = ?
      WHERE product_id = ?
    `);

    const result = stmt.run(
      updatedProduct.manufacturer_id,
      updatedProduct.name,
      updatedProduct.description,
      updatedProduct.price,
      updatedProduct.stock_quantity,
      id
    );
    return result;
  } catch (error) {
    console.error("Error updating product:", error.message);
  }
}

// 7
//  DELETE /products/:id
function deleteProduct(productID) {
  try {
    const stmt = db.prepare(`DELETE FROM products WHERE product_id = ?`);
    const result = stmt.run(productID);
    return result;
  } catch (error) {
    console.error("Error deleting product", error.message);
  }
}

// Kundhantering 8
function showCustomer(id) {
  try {
    const stmt =
      db.prepare(`SELECT customers.name, customers.email, customers.phone, customers.address, orders.order_date, orders.order_id
    FROM orders
    INNER JOIN customers ON orders.customer_id = customers.customer_id
    WHERE customers.customer_id = ?
    ORDER BY orders.order_date;`);

    const result = stmt.all(id); // HÄMTA ALLA med .all ORDRAR där customer_id = ?
    return result;
  } catch (error) {
    console.error("Could not retrieve customer based on ID", error.message);
  }
}

// 9
// PUT /customers/:id
function updateCustomer(updatedInfo, id) {
  try {
    const stmt = db.prepare(`UPDATE customers
    SET email = ?, phone = ?, address = ?
    WHERE customers.customer_id = ?;`);

    const result = stmt.run(
      updatedInfo.email,
      updatedInfo.phone,
      updatedInfo.address,
      id
    ); // Injecta ny info med .run
    return result;
  } catch (error) {
    console.error("Could not update customer based on ID", error.message);
    return
  }
}

// 10 Lista alla ordrar för en specifik kund
// GET /customers/:id/orders
function ordersOfCustomer(id) {
  try {
    const stmt = db.prepare(`
  SELECT customers.name, products.name AS product, orders_products.quantity, orders_products.unit_price, orders.order_id, orders.order_date
  FROM customers
  INNER JOIN products ON orders_products.product_id = products.product_id
  INNER JOIN orders_products ON orders.order_id = orders_products.order_id
  INNER JOIN orders ON customers.customer_id = orders.customer_id
  WHERE customers.customer_id = ?
  ORDER BY orders.order_date;`);

    const result = stmt.all(id);
    return result;
  } catch (error) {
    console.error("Could not retrieve customers orders", error.message);
  }
}

// 11
function getStatsProducts() {
  try {
    const stmt =
      db.prepare(`SELECT categories.name AS Category, COUNT(products.product_id) AS Product_count, ROUND(AVG(products.price), 2) AS Average_price
    FROM categories
    JOIN products_categories ON products_categories.category_id = categories.category_id
    JOIN products ON products_categories.product_id = products.product_id
    GROUP BY categories.name;`);

    const result = stmt.all();
    return result;
  } catch (error) {
    console.error("Could not retrieve all categories.", error.message);
  }
}

function getReviews() {
  // SISTA G DELEN
  try {
    const stmt =
      db.prepare(`SELECT products.name AS Product, ROUND(AVG(reviews.rating), 2) AS Average_Rating
      FROM products
      JOIN reviews ON products.product_id = reviews.product_id
      GROUP BY products.name;`);

    const result = stmt.all();
    return result;
  } catch (error) {
    console.error("Could not retrieve all Reviews", error.message);
  }
}

module.exports = {
  showProducts,
  showProductByID,
  showProductsByName,
  showProductsInCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  showCustomer,
  updateCustomer,
  ordersOfCustomer,
  getStatsProducts,
  getReviews,
  checkPrice,
  checkEmail,
  checkProductName,
};
