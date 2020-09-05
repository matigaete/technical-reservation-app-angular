<?php
header("Access-Control-Allow-Origin: http://localhost:80");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: *");
if ($_SERVER["REQUEST_METHOD"] != "PUT") {
    exit("Solo acepto peticiones PUT");
}
$jsonProducto = json_decode(file_get_contents("php://input"));
if (!$jsonProducto) {
    exit("No hay datos");
}

$bd = include_once "conexion.php";
$sentencia = $bd->prepare(
   "UPDATE producto 
    SET nombre = ?, descripcion = ?, categoria = ?, 
        stock = ?, stockCritico = ?, precioCompra = ?,
        precioVenta = ?, activo = ?
    WHERE codigo = ?");
$resultado = $sentencia->execute([
    $jsonProducto->_nombre, $jsonProducto->_descripcion, $jsonProducto->_tipo, 
    $jsonProducto->_stock, $jsonProducto->_stockCritico, $jsonProducto->_precioCompra, 
    $jsonProducto->_precioVenta, $jsonProducto->_activo, $jsonProducto->_codigo]);
    
echo json_encode($resultado);

?>