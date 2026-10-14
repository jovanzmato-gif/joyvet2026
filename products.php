<?php
require "db.php";

$stmt = $pdo->query(
    "SELECT product_id, name, category, price, stock,low_stock_threshold, expiry_date
     FROM products ORDER BY name"
);
$products = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Products</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    
    <?php  include "nav.php";?>
    <h2>Products</h2>

    <?php if (count($products) === 0): ?>
        <p>No products found yet.</p>
    <?php else: ?>
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Action</th>
            </tr>
            <?php foreach ($products as $p): ?>
                <tr style="<?=((int)$p["stock"] <=(int)$p["low_stock_threshold"]) ?  "background:#ffd6d6;" : ""?>">
                    <td><?= (int)$p["product_id"] ?></td>
                    <td><?= htmlspecialchars($p["name"]) ?></td>
                    <td><?= htmlspecialchars($p["category"]) ?></td>
                    <td><?= htmlspecialchars($p["price"]) ?></td>
                    <td><?= (int)$p["stock"] ?></td>
                    <td><?= htmlspecialchars($p["expiry_date"] ?? "") ?></td>
                    <td><a href="edit_product.php?id=<?=(int)$p["product_id"]?>">Edit</a></td>
                    <td>
    <form action="delete_product.php" method="POST"
          onsubmit="return confirm('Delete this product?');">
        <input type="hidden" name="id" value="<?= (int)$p["product_id"] ?>">
        <button type="submit">Delete</button>
    </form>
</td>
                </tr>
            <?php endforeach; ?>
        </table>
    <?php endif; ?>
</body>
</html>