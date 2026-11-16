export class Product {
  constructor(id, nombre, categoria, pvp) {
    this.id = Number(id);
    this.nombre = String(nombre).trim();
    this.categoria = String(categoria).trim();
    this.pvp = Number(Number(pvp).toFixed(2));
  }
}

export { Product as Producto };
