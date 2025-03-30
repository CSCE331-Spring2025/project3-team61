import { createFileRoute } from '@tanstack/react-router'
//import { useState, useEffect, FC } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export const Route = createFileRoute('/manager-inventory')({
  component: RouteComponent,
})

 function RouteComponent() {
//       const [products, setProducts] = useState<Product[]>([]);

//           useEffect(() => {
//               const getProducts = () => {
//                   fetch("/api/products")
//                       .then((res) => res.json())
//                       .then((res_json) => {
//                           setProducts(res_json);
//                       });
//               };
      
//               getProducts();
//           }, []);

   return <div>Hello, this is the manager price page!</div>
  
// }

// interface Product {
//   id: number;
//   product_type:
//       | "milk_tea"
//       | "fruit_tea"
//       | "brewed_tea"
//       | "fresh_milk"
//       | "ice_blended"
//       | "tea_mojito"
//       | "creama"
//       | "ice_cream"
//       | "misc"
//       | "topping"
//       | "special_item";
//   name: string;
//   price: number;
//   inventory: number;
 }

