import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product } from '../../interfaces/types';
import useProductStore from '../../store/useStore';
import { useState } from 'react';

const ProductTable = () => {
    const { products, setProducts } = useProductStore();
    const [sortColumn, setSortColumn] = useState<keyof Product | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const exportProductsToExcel = (products: Product[]) => {
        const ws = XLSX.utils.json_to_sheet(products);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'products.xlsx');
      };

      const handleSort = (column: keyof Product) => {
        const newDirection = 
          sortColumn === column ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
      
        const sortedProducts = [...products].sort((a, b) => {
          let compareA = a[column];
          let compareB = b[column];
      
          // Manejar valores null o undefined
          if (compareA == null) compareA = '';
          if (compareB == null) compareB = '';
      
          // Comparar según el tipo de datos
          if (typeof compareA === 'string' && typeof compareB === 'string') {
            // Comparar cadenas de texto
            compareA = compareA.toLowerCase();
            compareB = compareB.toLowerCase();
          } else if (typeof compareA === 'number' && typeof compareB === 'number') {
            // Comparar números
            if (compareA < compareB) return newDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return newDirection === 'asc' ? 1 : -1;
            return 0;
          }
      
          // Fallback en caso de tipos mixtos (string vs number)
          if (compareA < compareB) return newDirection === 'asc' ? -1 : 1;
          if (compareA > compareB) return newDirection === 'asc' ? 1 : -1;
          return 0;
        });
        
        setProducts(sortedProducts);
      };
      

      const renderHeader = (key: keyof Product, label: string) => (
        <th
          className={`py-1 px-2 border-b cursor-pointer ${sortColumn === key ? 'bg-gray-200' : ''}`}
          onClick={() => handleSort(key)}
        >
          {label}
          {sortColumn === key ? (sortDirection === 'asc' ? ' 🔼' : ' 🔽') : ''}
        </th>
      );

    return (
        <div className="p-2">
          <h1 className="text-xl font-bold mb-2">Product List</h1>
          <button
            onClick={() => exportProductsToExcel(products)}
            className="bg-blue-500 text-white px-3 py-1 rounded mb-2 text-sm"
          >
            Download Products as XLSX
          </button>
        
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-1 px-2 border-b">index</th>
                  {renderHeader('product', 'Product')}
                  {renderHeader('stock', 'Stock')}
                  {renderHeader('importer', 'Importer')}
                  {renderHeader('unit_price', 'Unit Price')}
                  {renderHeader('stockForAllUnit', 'Stock for All Units')}
                </tr>
              </thead>
              <tbody className="max-h-64 overflow-y-auto">
                {products.map((product, index) => (
                  <tr key={product.id + "index" + index} className={products.indexOf(product) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-1 px-2 border-b">{index + 1 }</td>
                    <td className="py-1 px-2 border-b">{product.product}</td>
                    <td className="py-1 px-2 border-b">{product.stock}</td>
                    <td className="py-1 px-2 border-b">{product.importer}</td>
                    <td className="py-1 px-2 border-b">${product.unit_price.toFixed(2)}</td>
                    <td className="py-1 px-2 border-b">{product.stockForAllUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      );
}

export default ProductTable