<?php
require "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit("Invalid request.");
}

$id       = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
$name     = trim($_POST["name"] ?? "");
$category = trim($_POST["category"] ?? "");
$price    = filter_input(INPUT_POST, "price", FILTER_VALIDATE_FLOAT);
$stock    = filter_input(INPUT_POST, "stock", FILTER_VALIDATE_INT);
$threshold = filter_input(INPUT_POST, "low_stock_threshold", FILTER_VALIDATE_INT);
$expiry   = trim($_POST["expiry_date"] ?? "");

if (!$id || $id < 1 || $name === "" || $category === "" ||
    $price === false || $price < 0 ||
    $stock === false || $stock < 0 ||
    $threshold === false || $threshold < 0) {
    exit("Invalid product details. Go back and check your entries.");
}

if ($expiry === "") {
    $expiry = null;
}

$stmt = $pdo->prepare(
    "UPDATE products
     SET name = :name, category = :category, price = :price,
         stock = :stock, low_stock_threshold = :threshold, expiry_date = :expiry
     WHERE product_id = :id"
);
$stmt->execute([
    "name"      => $name,
    "category"  => $category,
    "price"     => $price,
    "stock"     => $stock,
    "threshold" => $threshold,
    "expiry"    => $expiry,
    "id"        => $id
]);

echo "Product updated successfully. <a href='products.php'>View all products</a>";
?>