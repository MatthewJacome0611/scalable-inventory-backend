CREATE DATABASE IF NOT EXISTS inventario_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_db;

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  pvp DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_productos_pvp_nonnegative CHECK (pvp >= 0)
);
