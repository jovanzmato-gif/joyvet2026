<?php
require "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit("Please submit the product form.");
}

$name     = trim($_POST["name"] ?? "");
$category = trim($_POST["category"] ?? "");
$price    = filter_input(INPUT_POST, "price", FILTER_VALIDATE_FLOAT);
$stock    = filter_input(INPUT_POST, "stock", FILTER_VALIDATE_INT);
$threshold = filter_input(INPUT_POST, "low_stock_threshold", FILTER_VALIDATE_INT);
$expiry   = trim($_POST["expiry_date"] ?? "");

if ($name === "" || $category === "" || $price === false || $price < 0
    || $stock === false || $stock < 0 || $threshold === false || $threshold < 0) {
    exit("Invalid product details. Go back to the form and check your entries.");
}

if ($expiry === "") {
    $expiry = null;
}

$stmt = $pdo->prepare(
    "INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date)
     VALUES (:name, :category, :price, :stock, :threshold, :expiry)"
);
$stmt->execute([
    "name"      => $name,
    "category"  => $category,
    "price"     => $price,
    "stock"     => $stock,
    "threshold" => $threshold,
    "expiry"    => $expiry
]);

echo "Product saved successfully. <a href='products.php'>View all products</a>";
?>