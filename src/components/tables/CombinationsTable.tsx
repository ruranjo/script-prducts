import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import useProductStore from '../../store/useStore';
import { Product } from '../../interfaces/types';
import { useEffect, useState } from 'react';

const CombinationsTable = () => {
  const { products, limit, setLimit, setProducts } = useProductStore();
  const [combinations, setCombinations] = useState<Product[][]>([]);
  const [selectedCombinations, setSelectedCombinations] = useState<Product[][]>([]); // Estado para combinaciones seleccionadas
  const [productsDelecte, setProductsDelect] = useState<Product[][]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [comboSize, setComboSize] = useState<number>(5); // Estado para la cantidad de elementos en la combinación

  // Función para exportar combinaciones a Excel
  const exportCombinationsToExcel = (combinations: Product[][]) => {
    const data = combinations.map((combo, index) => {
      const totalPrice = combo.reduce((sum, product) => sum + product.unit_price, 0);
      const difference = limit - totalPrice;
      return {
        Index: index + 1,
        Products: combo.map(p => p.product).join(', '),
        ...combo.reduce((acc, product, idx) => ({ ...acc, [`Unit Price ${idx + 1}`]: product.unit_price }), {}),
        Limit: limit,
        'Total Price': totalPrice.toFixed(2),
        Difference: difference.toFixed(2)
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Combinations');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'combinations.xlsx');
  };

  const getCombinations = async (arr: Product[], size: number, maxPrice: number): Promise<Product[][]> => {
    const result: Product[][] = [];
    const combine = async (start: number, combo: Product[], totalPrice: number) => {
      if (combo.length === size) {
        if (totalPrice <= maxPrice) {
          result.push([...combo]);
        }
        return;
      }
      for (let i = start; i < arr.length; i++) {
        const newTotalPrice = totalPrice + arr[i].unit_price;
        if (newTotalPrice <= maxPrice)
        {
          await combine(i + 1, [...combo, arr[i]], newTotalPrice);
        }
      }
    };
    await combine(0, [], 0);
    return result;
  };

  const applyFilters = async () => {
    try {
      const combinationsResult = await getCombinations(products, comboSize, limit);
      setCombinations(combinationsResult);
      setError(null);
    } catch (error)
    {
      console.error("Error fetching combinations:", error);
      setError("Failed to fetch combinations. Please try again later.");
    }
  };

  useEffect(() => {
    applyFilters(); // Inicializar combinaciones al montar el componente
  }, [products]); // Dependencia en products para cargar las combinaciones al iniciar

  // Función para manejar la selección de una combinación
  const handleSelectCombination = (combo: Product[]) => {
    // Crea una copia de la lista de productos
    const updatedProducts = [...products];

    // Recorre cada producto en el combo seleccionado
    combo.forEach(comboProduct => {
      // Encuentra el producto en la lista de productos
      const productIndex = updatedProducts.findIndex(p => p.id === comboProduct.id);
      
      if (productIndex > -1) {
        // Reduce el stock del producto en la lista
        updatedProducts[productIndex].stock -= 1;

        // Si el stock llega a 0, elimina el producto
        if (updatedProducts[productIndex].stock <= 0) {
          setProductsDelect([...productsDelecte, [updatedProducts[productIndex]]]);
          updatedProducts.splice(productIndex, 1);
        }
      }
    });

    // Actualiza el estado de productos
    setProducts(updatedProducts);

    // Actualiza la lista de combinaciones seleccionadas
    setSelectedCombinations([...selectedCombinations, combo]);

    console.log("selectedCombinations: ", selectedCombinations);
  };

  const renderCombinationsHeader = () => {
    if (combinations.length === 0) return null;
    const firstCombo = combinations[0];
    return (
      <>
        {firstCombo.map((_, index) => (
          <th key={index} className="py-1 px-2 border-b">
            Unit Price {index + 1}
          </th>
        ))}
      </>
    );
  };

  const renderSelectedDelecte = () => {
    if (productsDelecte.length === 0) return null;
    return (
      <div className="mt-4">
        <h2 className="text-lg font-bold mb-2">Deleted Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-1 px-2 border-b">Index</th>
                <th className="py-1 px-2 border-b">Products</th>
                {productsDelecte[0].map((_, index) => (
                  <th key={index} className="py-1 px-2 border-b">
                    Unit Price {index + 1}
                  </th>
                ))}
                <th className="py-1 px-2 border-b">Limit</th>
                <th className="py-1 px-2 border-b">Total Price</th>
                <th className="py-1 px-2 border-b">Difference</th>
              </tr>
            </thead>
            <tbody className="max-h-64 overflow-y-auto">
              {productsDelecte.map((combo, index) => {
                const totalPrice = combo.reduce((sum, product) => sum + product.unit_price, 0);
                const difference = limit - totalPrice;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-1 px-2 border-b">{index + 1}</td>
                    <td className="py-1 px-2 border-b">
                      {combo.map(product => product.product).join(', ')}
                    </td>
                    {combo.map((product, idx) => (
                      <td key={idx} className="py-1 px-2 border-b">${product.unit_price.toFixed(2)}</td>
                    ))}
                    <td className="py-1 px-2 border-b">{limit}</td>
                    <td className="py-1 px-2 border-b">${totalPrice.toFixed(2)}</td>
                    <td className="py-1 px-2 border-b">${difference.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCombinationRows = () => {
    return combinations.map((combo, index) => {
      const totalPrice = combo.reduce((sum, product) => sum + product.unit_price, 0);
      const difference = limit - totalPrice;
      return (
        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
          <td className="py-1 px-2 border-b">{index + 1}</td>
          <td className="py-1 px-2 border-b">
            {combo.map(product => product.product).join(', ')}
          </td>
          {combo.map((product, idx) => (
            <td key={idx} className="py-1 px-2 border-b">${product.unit_price.toFixed(2)}</td>
          ))}
          <td className="py-1 px-2 border-b">{limit}</td>
          <td className="py-1 px-2 border-b">${totalPrice.toFixed(2)}</td>
          <td className="py-1 px-2 border-b">${difference.toFixed(2)}</td>
          <td className="py-1 px-2 border-b">
            <button
              onClick={() => handleSelectCombination(combo)}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              Add
            </button>
          </td>
        </tr>
      );
    });
  };

  const renderSelectedCombinations = () => {
    if (selectedCombinations.length === 0) return null;
    return (
      <div className="mt-4">
        <h2 className="text-lg font-bold mb-2">Selected Combinations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-1 px-2 border-b">Index</th>
                <th className="py-1 px-2 border-b">Products</th>
                {selectedCombinations[0].map((_, index) => (
                  <th key={index} className="py-1 px-2 border-b">
                    Unit Price {index + 1}
                  </th>
                ))}
                <th className="py-1 px-2 border-b">Limit</th>
                <th className="py-1 px-2 border-b">Total Price</th>
                <th className="py-1 px-2 border-b">Difference</th>
              </tr>
            </thead>
            <tbody className="max-h-64 overflow-y-auto">
              {selectedCombinations.map((combo, index) => {
                const totalPrice = combo.reduce((sum, product) => sum + product.unit_price, 0);
                const difference = limit - totalPrice;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-1 px-2 border-b">{index + 1}</td>
                    <td className="py-1 px-2 border-b">
                      {combo.map(product => product.product).join(', ')}
                    </td>
                    {combo.map((product, idx) => (
                      <td key={idx} className="py-1 px-2 border-b">${product.unit_price.toFixed(2)}</td>
                    ))}
                    <td className="py-1 px-2 border-b">{limit}</td>
                    <td className="py-1 px-2 border-b">${totalPrice.toFixed(2)}</td>
                    <td className="py-1 px-2 border-b">${difference.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <h2 className="text-lg font-bold mt-4 mb-2">Combinations</h2>
      <label className="mb-2 text-sm">Number of items in each combination:</label>
      <input
        type="number"
        value={comboSize}
        onChange={(e) => setComboSize(Number(e.target.value))}
        min="1"
        className="mb-4 p-1 border rounded"
      />
      <label className="mb-2 text-sm">Limit:</label>
      <input
        type="number"
        value={limit}
        onChange={(e) => setLimit(Number(e.target.value))}
        min="0"
        className="mb-4 p-1 border rounded"
      />
      <button
        onClick={applyFilters}
        className="bg-green-500 text-white px-3 py-1 rounded mb-2 text-sm"
      >
        Apply
      </button>
      <button
        onClick={() => exportCombinationsToExcel(combinations)}
        className="bg-blue-500 text-white px-3 py-1 rounded mb-2 text-sm ml-2"
      >
        Download Combinations as XLSX
      </button>
      {renderSelectedDelecte()}
      
      {renderSelectedCombinations()}
      <h2 className="text-lg font-bold mt-4 mb-2">Combinations</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-2 border-b">Index</th>
              <th className="py-1 px-2 border-b">Products</th>
              {renderCombinationsHeader()}
              <th className="py-1 px-2 border-b">Limit</th>
              <th className="py-1 px-2 border-b">Total Price</th>
              <th className="py-1 px-2 border-b">Difference</th>
              <th className="py-1 px-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="max-h-64 overflow-y-auto">
            {renderCombinationRows()}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default CombinationsTable;