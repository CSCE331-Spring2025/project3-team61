import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/menu-board")({
  component: MenuBoard,
});

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

function MenuBoard() {
  const [products, setProducts] = useState<Product[]>([]);

  const getProducts = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((res_json) => {
        setProducts(res_json);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  };

  useEffect(() => {
    getProducts();
  }, []);

  const drinkTypes = [
    "milk_tea",
    "fruit_tea",
    "brewed_tea",
    "fresh_milk",
    "ice_blended",
    "tea_mojito",
    "creama",
  ];

  const popularItems = products.filter((p) => p.product_type === "special_item");
  const allDrinks = products.filter((p) => drinkTypes.includes(p.product_type));
  const iceCreamItems = products.filter((p) => p.product_type === "ice_cream");
  const miscItems = products.filter((p) => p.product_type === "misc");

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="max-w-screen-2xl w-full p-5">
        <h1 className="text-3xl font-bold text-center mb-6">Menu Board</h1>
        {products.length === 0 ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : (
          <div className="grid grid-cols-3 grid-rows-[auto_1fr_auto] gap-6 h-[calc(100vh-8rem)]">
            {/* Popular Items */}
            <div className="col-span-2 row-span-1 bg-white p-4 rounded-md shadow-md">
              <h2 className="text-2xl font-bold mb-4">Popular Items</h2>
              <div className="space-y-4">
                {popularItems.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{product.name}</span>
                    <span className="text-lg">{centsToDollars(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Drinks */}
            <div className="row-span-2 bg-white p-4 rounded-md shadow-md overflow-y-auto">
              <h2 className="text-xl font-bold mb-3">All Drinks</h2>
              <div className="space-y-3">
                {allDrinks.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span>{centsToDollars(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ice Cream Box */}
            <div className="bg-white p-4 rounded-md shadow-md">
              <h2 className="text-xl font-bold mb-3">Ice Cream</h2>
              <div className="space-y-2">
                {iceCreamItems.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span>{centsToDollars(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Miscellaneous Box */}
            <div className="bg-white p-4 rounded-md shadow-md">
              <h2 className="text-xl font-bold mb-3">Miscellaneous</h2>
              <div className="space-y-2">
                {miscItems.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span>{centsToDollars(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div className="col-span-3 bg-white p-4 rounded-md shadow-md">
              <h2 className="text-xl font-bold mb-3">Accessibility</h2>
              <div className="space-y-2">
                {/* NOTE: Accessibility buttons to be added here */}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

function centsToDollars(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toFixed(2);
}