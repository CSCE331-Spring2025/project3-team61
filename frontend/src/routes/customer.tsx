import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import Chatbot from "../components/chatbot";

//import dotenv from "dotenv";

export const Route = createFileRoute("/customer")({
    component: CustomerPage,
});

interface Product {
    id: number;
    name: string;
    price: number;
    product_type: string;
    inventory: number;
    originalName?: string; // Used for image lookup
    calories: number;
    allergens: string[];
    img_src: string;
}

interface OrderItem {
    name: string;
    price: number;
    quantity: number;
    options: string[];
}

function CustomerPage() {
    const [started, setStarted] = useState(false);
    const [language, setLanguage] = useState<LanguageKey>("en");
    const [translatedText, setTranslatedText] = useState<
        Record<string, string>
    >({});
    const [products, setProducts] = useState<Product[]>([]);
    const [translatedProducts, setTranslatedProducts] = useState<Product[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null,
    );
    const [drinkCustomizeModalOpen, setDrinkCustomizeModalOpen] =
        useState<boolean>(false);

    const sizes = ["Small", "Regular", "Large"];
    const iceLevels = ["No Ice", "Less Ice", "Regular", "Extra Ice"];
    const sugarLevels = ["0%", "25%", "50%", "75%", "100%"];
    const [size, setSize] = useState("Regular");
    const [ice, setIce] = useState("Regular");
    const [sugar, setSugar] = useState("100%");
    const [quantity, setQuantity] = useState(1);
    const [selectedCategory, setSelectedCategory] =
        useState<string>("milk_tea");

    const [zoomLevel, setZoomLevel] = useState(1);
    const [contrastMode, setContrastMode] = useState<boolean>(false);

    const [isPaying, setIsPaying] = useState(false);
    const [thankYou, setThankYou] = useState(false);

    const paymentTypes = ["Card", "Cash"];

    const handlePayNow = () => {
        if (orderItems.length > 0) {
            setIsPaying(true);
        }
    };

    const handlePaymentSelected = (pt: string) => {
        fetch("/api/transaction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                paymentType: pt,
                items: orderItems,
            }),
        }).catch((err) => console.error(err));
        setOrderItems([]);
        setIsPaying(false);
        setThankYou(true);
    };

    type LanguageKey =
        | "en"
        | "es"
        | "fr"
        | "de"
        | "zh-Hans"
        | "vi"
        | "ko"
        | "ja"
        | "hi"
        | "ar";

    const languages: Record<LanguageKey, string> = {
        en: "English",
        es: "Español",
        fr: "Français (French)",
        de: "Deutsch (German)",
        "zh-Hans": "中文",
        vi: "Tiếng Việt",
        ko: "한국어",
        ja: "日本語 (Japanese)",
        hi: "हिंदी (Hindi)",
        ar: "العربية (Arabic)",
    };

    type TranslationRecord = Record<string, string>;

    const [translationRecordsCache, setTranslationRecordsCache] =
        useState<Record<LanguageKey, TranslationRecord>>();

    const AZURE_TRANSLATOR_KEY = import.meta.env.VITE_TRANSLATE_KEY;
    const AZURE_ENDPOINT =
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";
    const AZURE_REGION = import.meta.env.VITE_TRANSLATE_REGION;

    const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    const WEATHER_API_URL = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=77840&aqi=no`;

    const [tempLoaded, setTempLoaded] = useState<boolean>(false);
    const [temp, setTemp] = useState<number>(0);
    const [location, setLocation] = useState<string>("");
    const [imageConditionUri, setImageConditionUri] = useState<string>("");

    useEffect(() => {
        fetch(WEATHER_API_URL)
            .then((res) => res.json())
            .then((jsonRes) => {
                setLocation(jsonRes.location.name);
                setTemp(jsonRes.current.temp_f);
                setImageConditionUri("http:" + jsonRes.current.condition.icon);
                setTempLoaded(true);
            })
            .catch((err) => console.error("Failed to fetch weather", err));
    }, []);

    const categoryDisplayNames: Record<string, string> = {
        milk_tea: "Milk Tea",
        ice_cream: "Ice Cream",
        brewed_tea: "Tea",
        fruit_tea: "Fruit Tea",
        fresh_milk: "Fresh Milk",
        ice_blended: "Ice Blended",
        tea_mojito: "Tea Mojito",
        creama: "Crema",
        misc: "Misc",
        topping: "Toppings",
        special_item: "Special Items",
    };

    const categories = Object.keys(categoryDisplayNames);

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then(setProducts)
            .catch((err) => console.error("Failed to fetch products", err));
    }, []);

    useEffect(() => {
        let total = 0;
        for (const item of orderItems) {
            total += item.price * item.quantity;
        }
        setTotalPrice(total);
    }, [orderItems]);

    useEffect(() => {
        const labels = [
            "Tap to Start",
            "Back to Start",
            "Current Language",
            "Categories",
            "Choose Your Drink",
            "Your Order",
            "Total",
            "Pay Now",
            "Customize",
            "Size",
            "Sugar Level",
            "Ice Level",
            "Add to Order",
            "Select Payment Method",
            "Credit/Debit",
            "Go to the register after completing your order",
            "Thank you!",
            "Return to Home",
            "Your order has been placed successfully",
            "Calories",
            "Allergens",
            ...sizes,
            ...sugarLevels,
            ...iceLevels,
            ...paymentTypes,
            ...products.map((p) => p.name),
            ...Object.values(categoryDisplayNames),
        ];

        const translate = () => {
            let translateURL = AZURE_ENDPOINT;
            for (const language in languages) {
                translateURL += `&to=${language}`;
            }
            fetch(translateURL, {
                method: "POST",
                headers: {
                    "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY!,
                    "Ocp-Apim-Subscription-Region": AZURE_REGION,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    labels.map((label) => {
                        return { Text: label };
                    }),
                ),
            })
                .then((res) => res.json())
                .then((jsonRes) => {
                    // console.log(jsonRes);
                    let trc: Record<LanguageKey, TranslationRecord> =
                        {} as Record<LanguageKey, TranslationRecord>;
                    for (let i = 0; i < labels.length; i++) {
                        const { translations } = jsonRes[i];
                        for (const translation of translations) {
                            const { text, to } = translation;
                            const label = labels[i];

                            const lk = to as LanguageKey;

                            if (trc[lk] === undefined) {
                                trc[lk] = {} as TranslationRecord;
                            }

                            trc[lk][label] = text;
                        }
                    }

                    setTranslationRecordsCache(trc);
                })
                .catch((err) => console.error("Error:", err));
        };

        translate();
    }, [products]);

    useEffect(() => {
        if (translationRecordsCache !== undefined) {
            setTranslatedText(translationRecordsCache[language]);
        }
    }, [language, translationRecordsCache]);

    useEffect(() => {
        const translated = products.map((p) => ({
            ...p,
            originalName: p.name,
            name: translatedText[p.name] || p.name,
        }));
        setTranslatedProducts(translated);
    }, [translatedText, products]);

    const openModal = (product: Product) => {
        setSelectedProduct(product);
        setSize("Regular");
        setIce("Regular");
        setSugar("100%");
        setQuantity(1);
        setDrinkCustomizeModalOpen(true);
    };

    const addToOrder = () => {
        if (!selectedProduct) return;
        const item: OrderItem = {
            name: selectedProduct.name,
            price: selectedProduct.price,
            quantity,
            options: [size, `${sugar} sugar`, ice],
        };
        setOrderItems((prev) => [...prev, item]);
        setDrinkCustomizeModalOpen(false);
        setSelectedProduct(null);
    };

    const removeOrderItem = (indexToRemove: number) => {
        setOrderItems((prev) =>
            prev.filter((_, index) => index !== indexToRemove),
        );
    };

    const t = (key: string) => translatedText[key] || key;

    return (
        <div className="relative h-screen flex flex-col">
            {!started && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white">
                    <img
                        src="/Team-61.png"
                        alt="Team 61"
                        className="w-48 mb-6"
                    />
                    <select
                        value={language}
                        onChange={(e) =>
                            setLanguage(e.target.value as LanguageKey)
                        }
                        className="mb-6 border px-4 py-2 rounded"
                    >
                        {Object.entries(languages).map(
                            ([value, displayName]) => (
                                <option key={value} value={value}>
                                    {displayName}
                                </option>
                            ),
                        )}
                    </select>
                    <button
                        onClick={() => setStarted(true)}
                        className="bg-slate-800 text-white px-12 py-6 rounded-full text-3xl shadow-lg hover:bg-slate-700 cursor-pointer transition"
                    >
                        {t("Tap to Start")}
                    </button>
                </div>
            )}

            {started && !isPaying && (
                <>
                    <div
                        role="banner"
                        className="p-4 border-b border-gray-200 flex justify-between items-center bg-white"
                    >
                        <button
                            onClick={() => setStarted(false)}
                            className="bg-white border border-gray-300 px-4 py-2 rounded-md shadow hover:bg-gray-100 cursor-pointer"
                        >
                            ← {t("Back to Start")}
                        </button>
                        <div className="flex items-center gap-4 text-gray-500">
                            <button
                                onClick={() => setContrastMode((e) => !e)}
                                className="bg-white border border-gray-300 px-4 py-2 rounded-md shadow hover:bg-gray-100 cursor-pointer"
                            >
                                {contrastMode ? "Disable" : "Enable"} High
                                Contrast
                            </button>
                            {tempLoaded && (
                                <>
                                    <p
                                        className={
                                            contrastMode ? "font-bold" : ""
                                        }
                                    >
                                        {location} {temp} °F
                                    </p>
                                    <img
                                        className="w-14"
                                        src={imageConditionUri}
                                    />
                                </>
                            )}
                            <div className="flex gap-2 center-items">
                                <span
                                    className={contrastMode ? "font-bold" : ""}
                                >
                                    {t("Current Language")}:
                                </span>
                                <select
                                    className="w-10"
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage(
                                            e.target.value as LanguageKey,
                                        )
                                    }
                                >
                                    {Object.entries(languages).map(
                                        ([value, _]) => (
                                            <option key={value} value={value}>
                                                {value.toUpperCase()}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div className="flex gap-1 items-center">
                                <button
                                    onClick={() =>
                                        setZoomLevel((prev) =>
                                            Math.min(prev + 0.1, 1.5),
                                        )
                                    }
                                    className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                                >
                                    🔍+
                                </button>
                                <button
                                    onClick={() =>
                                        setZoomLevel((prev) =>
                                            Math.max(prev - 0.1, 0.8),
                                        )
                                    }
                                    className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                                >
                                    🔎−
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex flex-auto bg-gray-100"
                        style={{
                            fontSize: `${zoomLevel}rem`,
                            transition: "font-size 0.2s ease",
                        }}
                    >
                        {/* Sidebar */}
                        <div
                            role="navigation"
                            className="w-60 p-4 bg-white border-r border-gray-300"
                        >
                            <h2 className="text-lg font-bold mb-4">
                                {t("Categories")}
                            </h2>
                            <ul className="space-y-2">
                                {categories.map((cat) => (
                                    <li key={cat}>
                                        <button
                                            onClick={() =>
                                                setSelectedCategory(cat)
                                            }
                                            className={`cursor-pointer w-full text-left px-3 py-2 rounded-lg ${
                                                selectedCategory === cat
                                                    ? "bg-slate-700 text-white"
                                                    : "hover:bg-gray-100"
                                            }
                                                ${
                                                    contrastMode
                                                        ? "font-bold"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {t(categoryDisplayNames[cat])}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Product Grid */}
                        <div role="main" className="w-3/5 p-6 overflow-y-auto">
                            <h1 className="font-bold mb-6 text-3xl">
                                {t(categoryDisplayNames[selectedCategory])}
                            </h1>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                {translatedProducts
                                    .filter(
                                        (p) =>
                                            p.product_type === selectedCategory,
                                    )
                                    .map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => openModal(product)}
                                            className={
                                                "bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition" +
                                                (contrastMode
                                                    ? " border-5"
                                                    : "")
                                            }
                                        >
                                            <img
                                                src={imgPath(product.img_src)}
                                                alt={product.name}
                                                style={{
                                                    height: `${8 * zoomLevel}rem`,
                                                }}
                                                className="w-full object-contain rounded mb-2"
                                            />
                                            <div
                                                className="font-semibold"
                                                style={{
                                                    fontSize: `${1.1 * zoomLevel}rem`,
                                                }}
                                            >
                                                {product.name}
                                            </div>
                                            <div
                                                className={
                                                    contrastMode
                                                        ? "font-bold text-black"
                                                        : "text-gray-500"
                                                }
                                                style={{
                                                    fontSize: `${1 * zoomLevel}rem`,
                                                }}
                                            >
                                                {centsToDollars(product.price)}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                        {/* Cart */}
                        <div className="w-1/4 p-6 bg-white border-l border-gray-300 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold mb-4">
                                    {t("Your Order")}
                                </h2>
                                <div className="space-y-4 overflow-y-auto max-h-96">
                                    {orderItems.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
                                        >
                                            <div>
                                                <div className="font-semibold">
                                                    {item.name} x{" "}
                                                    {item.quantity}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item.options?.join(", ")}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="font-semibold">
                                                    {centsToDollars(
                                                        item.price *
                                                            item.quantity,
                                                    )}
                                                </div>
                                                <button
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        removeOrderItem(i)
                                                    }
                                                >
                                                    <img
                                                        src="/garbage.svg"
                                                        alt="Delete"
                                                        className="w-4 h-4"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold">Subtotal</span>
                                    <span>{centsToDollars(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-lg mt-1">
                                    <span className="font-bold">Tax</span>
                                    <span>
                                        {centsToDollars(totalPrice * 0.0725)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xl mt-2 font-bold">
                                    <span>Total</span>
                                    <span>
                                        {centsToDollars(totalPrice * 1.0725)}
                                    </span>
                                </div>

                                <button
                                    className="w-full bg-slate-800 text-white mt-6 py-3 rounded-md text-lg cursor-pointer font-bold"
                                    onClick={handlePayNow}
                                >
                                    {t("Pay Now")}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {/* Payment Page */}
            {started && isPaying && (
                <div className="p-8 flex flex-col items-center justify-center flex-1">
                    <button
                        onClick={() => setIsPaying(false)}
                        className="text-lg text-blue-600 hover:underline mb-6 w-fit self-start"
                    >
                        ← Back
                    </button>

                    <h1 className="text-4xl font-bold mb-10">
                        {t("Select Payment Method")}
                    </h1>

                    <div className="flex flex-wrap justify-center items-center gap-20">
                        <div
                            onClick={() => {
                                handlePaymentSelected("cash");
                            }}
                            className="w-60 h-80 border-2 border-black rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-gray-100"
                        >
                            <span className="text-3xl font-bold mb-4">
                                {t("Cash")}
                            </span>
                            <p className="text-center text-sm mt-6 p-4">
                                *
                                {t(
                                    "Go to the register after completing your order",
                                )}
                            </p>
                        </div>

                        <div
                            onClick={() => {
                                handlePaymentSelected("card");
                            }}
                            className="w-60 h-80 border-2 border-black rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-gray-100"
                        >
                            <span className="text-3xl font-bold">
                                {t("Credit/Debit")}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {/* Thank You Screen */}
            {started && thankYou && (
                <div className="p-8 flex flex-col items-center justify-center flex-1">
                    <h1 className="text-5xl font-bold text-green-600 mb-8">
                        🎉 {t("Thank you!")}
                    </h1>
                    <p className="text-2xl mb-10 text-center">
                        {t("Your order has been placed successfully")}.
                    </p>
                    <button
                        onClick={() => {
                            setThankYou(false);
                            setStarted(false);
                            setOrderItems([]);
                        }}
                        className="bg-slate-800 text-white px-10 py-4 rounded-lg text-xl hover:bg-slate-700"
                    >
                        {t("Return to Home")}
                    </button>
                </div>
            )}

            <Modal
                isOpen={drinkCustomizeModalOpen}
                onRequestClose={() => setDrinkCustomizeModalOpen(false)}
                contentLabel="Customize Drink"
                className="w-full max-w-xl mx-auto mt-20 bg-white p-6 rounded-xl shadow-xl"
                // overlayClassName="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-start z-50"
            >
                <h2 className="text-2xl font-bold">
                    {t("Customize")} {selectedProduct?.name}
                </h2>
                <div className="text-gray-500">
                    {t("Calories")}: {selectedProduct?.calories} cal
                </div>
                <div className="text-gray-500 mb-4">
                    {selectedProduct?.allergens !== undefined &&
                        selectedProduct?.allergens.length > 0 && (
                            <div>
                                {t("Allergens")}:{" "}
                                {selectedProduct?.allergens.join(", ")}
                            </div>
                        )}
                </div>
                <div className="mb-3">
                    <label className="font-semibold">{t("Size")}</label>
                    <OptionButtons
                        options={sizes}
                        value={size}
                        setValue={setSize}
                        t={t}
                    />
                </div>
                <div className="mb-3">
                    <label className="font-semibold">{t("Sugar Level")}</label>
                    <OptionButtons
                        options={sugarLevels}
                        value={sugar}
                        setValue={setSugar}
                        t={t}
                    />
                </div>
                <div className="mb-3">
                    <label className="font-semibold">{t("Ice Level")}</label>
                    <OptionButtons
                        options={iceLevels}
                        value={ice}
                        setValue={setIce}
                        t={t}
                    />
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() =>
                                setQuantity((prev) =>
                                    prev > 1 ? prev - 1 : prev,
                                )
                            }
                            className="w-8 h-8 bg-gray-200 rounded cursor-pointer"
                        >
                            -
                        </button>
                        <div className="text-lg">{quantity}</div>
                        <button
                            onClick={() => setQuantity((prev) => prev + 1)}
                            className="w-8 h-8 bg-gray-200 rounded cursor-pointer"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-lg font-bold">
                        {centsToDollars(
                            (selectedProduct?.price || 0) * quantity,
                        )}
                    </div>
                </div>
                <button
                    onClick={addToOrder}
                    className="mt-6 bg-slate-800 text-white w-full py-3 rounded-md text-lg cursor-pointer"
                >
                    {t("Add to Order")}
                </button>
            </Modal>
            <Chatbot language={language} />
        </div>
    );
}

function OptionButtons({
    options,
    value,
    setValue,
    t,
}: {
    options: string[];
    value: string;
    setValue: (v: string) => void;
    t: (label: string) => string;
}) {
    return (
        <div className="flex gap-2 mt-2 flex-wrap">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => setValue(option)}
                    className={`cursor-pointer px-3 py-2 rounded border ${value === option ? "bg-slate-700 text-white" : "bg-white border-gray-300"}`}
                >
                    {t(option)}
                </button>
            ))}
        </div>
    );
}

function imgPath(img_src: string): string {
    return "/static/" + img_src;
}

function centsToDollars(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
