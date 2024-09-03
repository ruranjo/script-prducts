// store/productStore.ts
import { create } from 'zustand';
import { Product } from '../interfaces/types';
import productsJson from '../data/inventary.json';

interface ProductState {
  products: Product[];
  limit: number; // Nuevo atributo para límite
  itemCount: number; // Nuevo atributo para cantidad de items
  addProduct: (product: Product) => void;
  removeProduct: (id: number) => void;
  updateProduct: (updatedProduct: Product) => void;
  setProducts: (products: Product[]) => void;
  setLimit: (limit: number) => void; // Nuevo método para actualizar el límite
  setItemCount: (count: number) => void; // Nuevo método para actualizar itemCount
}

const useProductStore = create<ProductState>((set) => ({
  products: productsJson,
  limit: 13, // Valor inicial para `limit`, ajustable según sea necesario
  itemCount: productsJson.length, // Valor inicial basado en la cantidad de productos
  addProduct: (product) => set((state) => ({
    products: [...state.products, product],
    itemCount: state.itemCount + 1, // Incrementa itemCount cuando se agrega un producto
  })),
  removeProduct: (id) => set((state) => ({
    products: state.products.filter((product) => product.id !== id),
    itemCount: state.itemCount - 1, // Decrementa itemCount cuando se elimina un producto
  })),
  updateProduct: (updatedProduct) => set((state) => ({
    products: state.products.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    ),
  })),
  setProducts: (products) => set({ 
    products,
    itemCount: products.length // Actualiza itemCount basado en la nueva lista de productos
  }),
  setLimit: (limit) => set({ limit }), // Implementación del método para actualizar `limit`
  setItemCount: (count) => set({ itemCount: count }), // Implementación del método para actualizar `itemCount`
}));

export default useProductStore;
