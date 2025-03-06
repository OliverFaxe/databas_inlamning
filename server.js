const express = require("express");
const {
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
} = require("./database"); // Importera funktionen från 'database.js'

const app = express();

app.use(express.json()); // MIDDLEWARE TO PARSE JSON request BODY
// Detta behövs för att post ska funka att skicka body object req.

app.listen(8001, () => {
  console.log("Server is running on port 8001");
});

app.get("", (req, res) => {
  // "Framsida localhost:8001"
  try {
    res.send("Welcome!");
  } catch (error) {
    res.send("Error");
  }
});

// Route för att visa produkter
app.get("/products", (req, res) => {
  // HÄMTA ALLA PRODUKTER
  // /products för att visa produkterna från databasen
  const sort = req.query.sort; // price_asc eller price_desc

  try {
    const products = showProducts(sort);
    res.json(products); // Returnerar resultaten som JSON
  } catch (error) {
    res.status(500).send(error.message); // Returnerar felmeddelandet om något går fel
  }
});

app.get("/search", (req, res) => {
  // HÄMTA PRODUKT BASERAT PÅ SEARCHTERM
  const searchterm = req.query.name;
  const results = showProductsByName(searchterm);
  if (results.length > 0) {
    res.json(results);
  } else {
    res.status(404).send("No product with that name");
  }
});

app.get("/category", (req, res) => {
  // HÄMTA PRODUKTER BASERAT PÅ ETT CATEGORY ID
  const id = req.query.id; // end point blir "/category?id=x" key:n är id och värdet är x och blir tillgängligt med req.query
  const results = showProductsInCategory(id);
  if (results.length > 0) {
    res.json(results);
  } else {
    res
      .status(404)
      .send("Category ID doesn't exist / No products in this category");
  }
});

app.post("/products", (req, res) => {
  // Extract product properties from the request body
  const { manufacturer_id, name, description, price, stock_quantity } =
    req.body;

  try {
    // Validate the product fields
    checkProductName(name); // Validate name
    checkPrice(price); // Validate price

    if (!manufacturer_id) {
      throw new Error("Manufacturer ID is required");
    }

    if (stock_quantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }

    // Create the new product after validation passes
    const newProduct = {
      manufacturer_id,
      name,
      description,
      price,
      stock_quantity,
    };
    const result = createProduct(newProduct);

    if (result) {
      // Send a success message along with the newly created product's ID
      res.status(201).json({
        message: "Product created successfully",
        productId: result.lastInsertRowid, // Return the ID of the newly inserted product
      });
    } else {
      res.status(500).json({ error: "Failed to create product" });
    }
  } catch (error) {
    console.error("Failed to create product:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// PUT /PRODUCTS/:ID
app.put("/products/:id", (req, res) => {
  try {
    const updatedProduct = req.body;
    const productId = req.params.id;

    checkProductName(updatedProduct.name);
    checkPrice(updatedProduct.price);

    if (!updatedProduct.manufacturer_id) {
      throw new Error("Manufacturer ID is required");
    }

    if (updatedProduct.stock_quantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }

    const result = updateProduct(updatedProduct, productId);

    if (result.changes) {
      res.status(200).json({ message: "Product updated successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Failed to update product:", error.message);
    res.status(400).json({ error: error.message });
  }
});
// DELETE /PRODUCTS/:ID
app.delete("/products/:id", (req, res) => {
  const productId = req.params.id;

  try {
    const result = deleteProduct(productId);

    if (result.changes) {
      res.status(200).json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Failed to delete product:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/customers/:id", (req, res) => {
  const targetID = req.params.id;
  try {
    const result = showCustomer(targetID);
    res.json(result);
  } catch (error) {
    console.error("Cannot show the customer with ID:", targetID);
  }
});

app.put("/customers/:id", (req, res) => {
  const updatedInfo = req.body;
  const targetID = req.params.id;

  try {
    if (updatedInfo.email && !checkEmail(updatedInfo.email)) {
      throw new Error("Invalid email");
    }

    if (!updatedInfo.address) {
      throw new Error("Address is required.");
    }
    const result = updateCustomer(updatedInfo, targetID);
    // Skickar svar efter if checken om det lyckades eller inte.
    if (result.changes > 0) {
      res.status(200).json({ message: "Customer updated successfully" });
    } else {
      res.status(500).json({ error: "Failed to update customer" });
    }
  } catch (error) {
    console.error("Error updating customer:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET /CUSTOMERS/:ID/ORDERS
app.get("/customers/:id/orders", (req, res) => {
  const targetID = req.params.id;
  try {
    const result = ordersOfCustomer(targetID);
    res.json(result);
  } catch (error) {
    console.error(error.message);
  }
});

app.get("/products/stats", (req, res) => {
  try {
    res.json(getStatsProducts());
  } catch (error) {
    console.error("Can't recieve stats about products", error.message);
  }
});

app.get("/reviews/stats", (req, res) => {
  try {
    res.json(getReviews());
  } catch (error) {
    console.error("Can't recieve stats about reviews", error.message);
  }
});

// Måste vara längst nere annars interferar med route i endpoint
app.get("/products/:id", (req, res) => {
  // HÄMTA PRODUKT BASERAT PÅ ID
  const productId = req.params.id; // Sparar route nummer som productID
  const product = showProductByID(productId); // hämtar rätt product
  if (product) {
    res.json(product); // visar json product
  } else {
    res.status(404).send("Product not found");
  }
});
