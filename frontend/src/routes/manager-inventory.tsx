import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export const Route = createFileRoute('/manager-inventory')({
  component: ManagerInventory,
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

 // TODO add functionality to "Edit Inventory" Button
 //const handleEditButton: 

 function ManagerInventory() {
       const [products, setProducts] = useState<Product[]>([]);

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
      <h1 className="text-3xl font-bold mb-8">Manager Inventory</h1>
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
                      <span className="font-bold text-right flex-1 p-2">Inventory: {product.inventory}</span>
                      <button
                        className="bg-gray-100 p-2 rounded"
                       //onClick={() => handleEditButton(product)}
                      >
                        Edit Inventory
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      );
  
 }


