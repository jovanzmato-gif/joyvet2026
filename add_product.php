<?php
require "db.php";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Add Product</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <?php  include "nav.php";?>
    <h2>Add Product</h2>

    <form action="save_product.php" method="POST">
        <label>Name:</label>
        <input type="text" name="name" required><br><br>

        <label>Category:</label>
        <input type="text" name="category" required><br><br>

        <label>Price:</label>
        <input type="number" name="price" step="0.01" min="0" required><br><br>

        <label>Stock:</label>
        <input type="number" name="stock" min="0" required><br><br>

        <label>Low Stock Threshold:</label>
        <input type="number" name="low_stock_threshold" min="0" value="10" required><br><br>

        <label>Expiry Date:</label>
        <input type="date" name="expiry_date"><br><br>

        <button type="submit">Save Product</button>
    </form>

    <p><a href="products.php">View all products</a></p>
</body>
</html>