import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export const Route = createFileRoute('/manager-price')({
  component: ManagerPrice,
})

interface Product {
  id: number;
  product_type:
      | "milk_tea"
      | "fruit_tea"
      | "brewed_tea"
      | "fresh_milk"
      | "ice_blended"
      | "tea_mojito"
      | "creama"
      | "ice_cream"
      | "misc"
      | "topping"
      | "special_item";
  name: string;
  price: number;
  inventory: number;
 }
 

 function ManagerPrice() {
       const [products, setProducts] = useState<Product[]>([]);
       const [product_selected, setProductSelected] = useState<Product | null>(null);
       const [newPrice, setNewPrice] = useState<number>(0);
       const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

       const handleEditButton = (product: Product) => {
        setProductSelected(product);
        setNewPrice(product.price);
        setModalIsOpen(true);
      };

      const handlePriceUpdate = async () => {
        if (!product_selected) return;

      const response = await fetch(`/api/products/${product_selected.id}/price`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: newPrice }),
      });
  
      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product_selected.id ? { ...p, price: newPrice } : p
          )
        );
        setModalIsOpen(false);
      } else {
        alert("Failure to update price");
      }
    };

          useEffect(() => {
              const getProducts = () => {
                  fetch("/api/products")
                      .then((res) => res.json())
                      .then((res_json) => {
                          setProducts(res_json);
                      });
              };
      
              getProducts();
          }, []);

          const categories = [
            "milk_tea",
            "fruit_tea",
            "brewed_tea",
            "fresh_milk",
            "ice_blended",
            "tea_mojito",
            "creama",
            "ice_cream",
            "misc",
            "topping",
            "special_item"
          ];

          return(
<div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manager Price</h1>
        {categories.map((category) => {
          const filteredProducts = products.filter((p) => p.product_type === category);
          
          return (
            <div key={category} className="mb-6">
              <h2 className="text-xl font-semibold capitalize mb-2">
                {category.replace("_", " ")}
              </h2>
              <div className="border rounded-lg p-4 shadow-sm bg-white">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex justify-between p-2 border-b">
                      <span>{product.name}</span>
                      <span className="font-bold text-right flex-1 p-2">Price: {centsToDollars(product.price)}</span>
                      <button
                        className="bg-gray-100 p-2 rounded"
                       onClick={() => handleEditButton(product)}
                      >
                        Edit Price
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

<Modal
        isOpen={modalIsOpen}

        onRequestClose={() => setModalIsOpen(false)}
        className="flex justify-center flex-col content-center flex-wrap h-screen"
      >
        <div className="mt-10 w-150 bg-white rounded-md">
          <div className="p-4 border-b-4 border-gray-200">
            <div className="flex justify-between">
              <h2 className="font-bold text-xl">Edit Price</h2>
              <button onClick={() => setModalIsOpen(false)}>Close</button>
            </div>
            <div className="text-gray-400 font-bold">{product_selected?.name}</div>
          </div>
          <div className="p-4">
            <div className="font-bold mb-1">New Price (in cents)</div>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="border-2 border-gray-300 w-full rounded px-2 py-1 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalIsOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceUpdate}
                className="bg-slate-700 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal>

      </div>
      );
  
 }

 function centsToDollars(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toFixed(2);
}


