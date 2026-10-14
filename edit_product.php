<?php
require "db.php";

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    exit("Invalid product ID.");
}

$stmt = $pdo->prepare("SELECT * FROM products WHERE product_id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    exit("Product not found.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Edit Product</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <?php include "nav.php"; ?>
    <h2>Edit Product</h2>

    <form action="update_product.php" method="POST">
        <input type="hidden" name="id" value="<?= (int)$product["product_id"] ?>">

        <label>Name:</label>
        <input type="text" name="name" required
               value="<?= htmlspecialchars($product["name"]) ?>"><br><br>

        <label>Category:</label>
        <input type="text" name="category" required
               value="<?= htmlspecialchars($product["category"]) ?>"><br><br>

        <label>Price:</label>
        <input type="number" name="price" step="0.01" min="0" required
               value="<?= htmlspecialchars($product["price"]) ?>"><br><br>

        <label>Stock:</label>
        <input type="number" name="stock" min="0" required
               value="<?= (int)$product["stock"] ?>"><br><br>

        <label>Low Stock Threshold:</label>
        <input type="number" name="low_stock_threshold" min="0" required
               value="<?= (int)$product["low_stock_threshold"] ?>"><br><br>

        <label>Expiry Date:</label>
        <input type="date" name="expiry_date"
               value="<?= htmlspecialchars($product["expiry_date"] ?? "") ?>"><br><br>

        <button type="submit">Update Product</button>
    </form>
</body>
</html>