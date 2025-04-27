import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, FC } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export const Route = createFileRoute("/cashier")({
    component: Cashier,
});

interface OrderItem {
    name: string;
    price: number;
    options: string[];
    quantity: number;
}

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
    calories: number;
    img_src: string;
}

const imgSize = "30";

const ExclusiveButtons: FC<{
    options: string[];
    defaultOption: string;
    setOption: (so: string) => void;
}> = ({ options, defaultOption, setOption }) => {
    const [selectedOption, setSelectedOption] = useState<string>(defaultOption);

    const handleClick = (option: string) => {
        setSelectedOption(option);
        setOption(option);
    };

    return (
        <div className="mt-3 flex justify-around gap-4">
            {options.map((option) => (
                <button
                    className={`${option === selectedOption ? "border-3 border-gray-500 bg-gray-100" : " border-2 border-gray-200"} border grow rounded-md h-13 flex justify-center flex-wrap content-center`}
                    onClick={() => handleClick(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};

const ProductButton: FC<{
    addItem: (oi: OrderItem) => void;
    product: Product;
}> = ({ addItem, product }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const sizes = ["Small", "Regular", "Large"];
    const defaultSize = sizes[1];

    const iceLevels = ["No Ice", "Less Ice", "Regular", "Extra Ice"];
    const defaultIceLevel = iceLevels[2];

    const sugarLevels = ["0%", "25%", "50%", "75%", "100%"];
    const defaultSugarLevel = sugarLevels[2];

    const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
    const [selectedIceLevel, setSelectedIceLevel] =
        useState<string>(defaultIceLevel);
    const [selectedSugarLevel, setSelectedSugarLevel] =
        useState<string>(defaultSugarLevel);

    const [quantity, setQuantity] = useState<number>(1);

    const handleAddToOrder = () => {
        let options: string[] = [];

        options.push(selectedSize);
        if (selectedIceLevel !== defaultIceLevel)
            options.push(selectedIceLevel);
        if (selectedSugarLevel !== defaultSugarLevel)
            options.push(selectedSugarLevel + " sugar");

        const order: OrderItem = {
            name: product.name,
            price: product.price * quantity,
            options: options,
            quantity: quantity,
        };

        addItem(order);
        setIsModalOpen(false);
    };

    return (
        <>
            <button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                <div className="bg-white p-4 rounded-md min-w-70 flex flex-col content center">
                    <div className="bg-white min-w-50 h-35 rounded-md flex flex-wrap justify-center content-center">
                        <img
                            className="max-h-35 max-w-50"
                            src={imgPath(product.img_src)}
                            alt={product.name}
                        />
                        {
                            // <div className="text-gray-100 font-bold">
                            //     {product.name}
                            // </div>
                        }
                    </div>
                    <div className="font-bold mt-2">{product.name}</div>
                    <div>{centsToDollars(product.price)}</div>
                </div>
            </button>
            <Modal
                isOpen={isModalOpen}
                className="flex justify-center flex-col content-center flex-wrap h-screen"
            >
                <div className="mt-10 w-150 h-200 bg-white rounded-md">
                    <div className="p-4 border-b-4 border-gray-200">
                        <div className="flex justify-between">
                            <h2 className="font-bold text-xl">
                                Customize {product.name}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}>
                                Close
                            </button>
                        </div>
                        <div className="text-gray-400 font-bold">
                            {centsToDollars(product.price)} • {product.calories} cal
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="font-bold">Size</div>
                        <ExclusiveButtons
                            options={sizes}
                            defaultOption={defaultSize}
                            setOption={setSelectedSize}
                        />
                        <div className="mt-4 font-bold">Ice Level</div>
                        <ExclusiveButtons
                            options={iceLevels}
                            defaultOption={defaultIceLevel}
                            setOption={setSelectedIceLevel}
                        />
                        <div className="mt-4 font-bold">Sugar Level</div>
                        <ExclusiveButtons
                            options={sugarLevels}
                            defaultOption={defaultSugarLevel}
                            setOption={setSelectedSugarLevel}
                        />
                        <div className="mt-4 mb-2 font-bold">
                            Special Instructions
                        </div>
                        <textarea className="border-2 border-gray-300 w-full h-30 rounded" />
                        <div className="flex justify-between mt-20">
                            <div className="flex text-xl">
                                <button
                                    onClick={() =>
                                        setQuantity((q) =>
                                            q === 1 ? q : q - 1,
                                        )
                                    }
                                >
                                    <img
                                        src="minus.svg"
                                        width="20"
                                        className="mr-2 mt-0.5 border rounded-xl"
                                    />
                                </button>
                                <div>{quantity}</div>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                >
                                    <img
                                        src="plus.svg"
                                        width="20"
                                        className="ml-2 mt-0.5 border rounded-xl"
                                    />
                                </button>
                            </div>
                            <div className="text-xl">
                                Total:{" "}
                                {centsToDollars(quantity * product.price)}
                            </div>
                        </div>
                        <button
                            className="w-full bg-slate-700 text-white mt-15 h-13 flex flex-wrap justify-center content-center rounded-xl"
                            onClick={handleAddToOrder}
                        >
                            Add to Order
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

function Cashier() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

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

    useEffect(() => {
        setTotalPrice(0);
        orderItems.map((oi) => {
            setTotalPrice((t) => t + oi.price);
        });
    }, [orderItems]);

    const handlePayNow = () => {
        setOrderItems([]);
    };

    const addItem = (oi: OrderItem) => {
        setOrderItems((ois) => [...ois, oi]);
    };

    const deleteOrderItem = (idx: number) => {
        setOrderItems((currentItems) =>
            currentItems.filter((_, index) => index !== idx),
        );
    };

    return (
        <div className="flex justify-center h-screen">
            <div className="max-w-screen-2xl h-screen">
                <div className="flex h-screen">
                    <div className="min-w-xs">
                        <button
                            className="flex w-60 h-10 flex-wrap content-center mt-3 bg-gray-200 rounded-lg cursor-pointer"
                            onClick={() => router.history.back()}
                        >
                            <img
                                width="25"
                                className="ml-3 mr-3"
                                src="left-arrow.svg"
                            />
                            <div className="font-bold">Back</div>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-4 grow bg-gray-100 justify-center h-screen pt-5">
                        {products.map((product) => (
                            <ProductButton
                                key={product.name}
                                addItem={addItem}
                                product={product}
                            />
                        ))}
                    </div>
                    <div className="min-w-xs">
                        <div className="min-h-15 flex justify-end border-b-3 border-b-gray-200">
                            <img
                                width={imgSize}
                                height={imgSize}
                                src="settings.svg"
                            />
                            <img
                                className="ml-4"
                                width={imgSize}
                                height={imgSize}
                                src="world.svg"
                            />
                        </div>
                        <div className="ml-4">
                            <h1 className="mt-10 font-bold text-xl">
                                Current Order
                            </h1>
                            <div className="mt-5 border-b-3 border-b-gray-200">
                                {orderItems.map((oi, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-gray-100 rounded mb-5"
                                    >
                                        <div className="flex justify-between">
                                            <div className="font-bold">
                                                {oi.name}{" "}
                                                {oi.quantity > 1
                                                    ? `x ${oi.quantity}`
                                                    : ""}
                                            </div>
                                            <div>
                                                {centsToDollars(oi.price)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div className="font-bold text-gray-400">
                                                {oi.options.join()}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    deleteOrderItem(idx)
                                                }
                                            >
                                                <img
                                                    width="14"
                                                    src="garbage.svg"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-3">
                                <div className="font-bold">Subtotal</div>
                                <div>{centsToDollars(totalPrice)}</div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <div className="font-bold">Tax</div>
                                <div>{centsToDollars(totalPrice * 0.0725)}</div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <div className="font-bold text-lg">
                                    Total Price
                                </div>
                                <div className="text-lg">
                                    {centsToDollars(totalPrice * 1.0725)}
                                </div>
                            </div>
                            <button
                                className="w-full bg-slate-700 text-white h-15 rounded-lg font-bold mt-10"
                                onClick={handlePayNow}
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function imgPath(img_src: string): string {
    return "/static/" + img_src;
}

function centsToDollars(cents: number): string {
    const dollars = cents / 100;
    return "$" + dollars.toFixed(2);
}
