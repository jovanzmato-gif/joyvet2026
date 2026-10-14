<?php
require "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit("Invalid request.");
}

$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    exit("Invalid product ID.");
}

$stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
$stmt->execute([$id]);

if ($stmt->rowCount() > 0) {
    echo "Product deleted successfully. <a href='products.php'>View all products</a>";
} else {
    echo "Product not found. <a href='products.php'>View all products</a>";
}
?>