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
 
 function ManagerInventory() {
      const [products, setProducts] = useState<Product[]>([]);
      const [product_selected, setProductSelected] = useState<Product | null>(null);
      const [newInventory, setNewInventory] = useState<number>(0);
      const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
      const [newDrinkModalOpen, setNewDrinkModalOpen] = useState(false);
      const [newDrinkName, setNewDrinkName] = useState("");
      const [newDrinkCategory, setNewDrinkCategory] = useState<Product["product_type"]>("milk_tea");
      const [newDrinkInventory, setNewDrinkInventory] = useState<number>(0);


      const handleEditButton = (product: Product) => {
        setProductSelected(product);

        setNewInventory(product.inventory);
        setModalIsOpen(true);
      };

      const handleInvUpdate = async () => {
        if (!product_selected) return;
      
        const response = await fetch(`/api/products/${product_selected.id}/inventory`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inventory: newInventory }),
        });
      
        if (response.ok) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === product_selected.id ? { ...p, inventory: newInventory } : p
            )
          );
          setModalIsOpen(false);
        } else {
          alert("Failure to update inventory");
        }
      };

      const handleAddDrink = async () => {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newDrinkName,
            product_type: newDrinkCategory,
            inventory: newDrinkInventory,
            price: 0,
          }),
        });
      
        if (response.ok) {
          const newProduct = await response.json();
          setProducts((prev) => [...prev, newProduct]);
          setNewDrinkModalOpen(false);
          setNewDrinkName("");
          setNewDrinkInventory(0);
        } else {
          alert("Failed new drink ");
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
                        onClick={() => handleEditButton(product)}
                        >
                          Edit Inventory
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
          <h2 className="font-bold text-xl">Edit Inventory</h2>
          <button onClick={() => setModalIsOpen(false)}>Close</button>
        </div>
        <div className="text-gray-400 font-bold">{product_selected?.name}</div>
      </div>
      <div className="p-4">
        <div className="font-bold mb-1">New Inventory</div>
        <input
          type="number"
          value={newInventory}
          onChange={(e) => setNewInventory(Number(e.target.value))}
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
            onClick={handleInvUpdate}
            className="bg-slate-700 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Modal>

  {// new drink
  }

  <div className="flex justify-center mt-10">
    <button
      onClick={() => setNewDrinkModalOpen(true)}
      className="bg-slate-700 text-white px-4 py-2 rounded shadow hover:bg-slate-800"
    >
      Add New Drink
    </button>
  </div>

  <Modal
  isOpen={newDrinkModalOpen}
  onRequestClose={() => setNewDrinkModalOpen(false)}
  className="flex justify-center items-center h-screen"
>
  <div className="mt-10 w-[400px] bg-white rounded-md shadow-lg">
    <div className="p-4 border-b-4 border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">Add New Drink</h2>
        <button onClick={() => setNewDrinkModalOpen(false)}>Close</button>
      </div>
    </div>
    <div className="p-4">
      <label className="block font-bold mb-1">Name</label>
      <input
        type="text"
        value={newDrinkName}
        onChange={(e) => setNewDrinkName(e.target.value)}
        className="border-2 border-gray-300 w-full rounded px-2 py-1 mb-4"
      />
      <label className="block font-bold mb-1">Category</label>
      <select
        value={newDrinkCategory}
        onChange={(e) => setNewDrinkCategory(e.target.value as Product["product_type"])}
        className="border-2 border-gray-300 w-full rounded px-2 py-1 mb-4"
      >
        {categories.map((type) => (
          <option key={type} value={type}>
            {type.replace("_", " ")}
          </option>
        ))}
      </select>
      <label className="block font-bold mb-1">Starting Inventory</label>
      <input
        type="number"
        value={newDrinkInventory}
        onChange={(e) => setNewDrinkInventory(Number(e.target.value))}
        className="border-2 border-gray-300 w-full rounded px-2 py-1 mb-4"
      />
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setNewDrinkModalOpen(false)}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleAddDrink}
          className="bg-slate-700 text-white px-4 py-2 rounded"
        >
          Add Drink
        </button>
      </div>
    </div>
  </div>
  </Modal>

  </div>
  );
  
}


