import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Modal from "react-modal";

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
    image_url?: string;
    originalName?: string; // Added for image lookup
    calories: number;
    img_src: string;
}

function MenuBoard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [translatedProducts, setTranslatedProducts] = useState<Product[]>([]);
    const [translatedText, setTranslatedText] = useState<
        Record<string, string>
    >({});
    const [language, setLanguage] = useState<LanguageKey>("en");
    const router = useRouter();
    const [fontSize, setFontSize] = useState(16);
    const [showCalories, setShowCalories] = useState<boolean>(false);

    const [showAccessibilityModal, setShowAccessibilityModal] =
        useState<boolean>(false);

    const AZURE_TRANSLATOR_KEY = import.meta.env.VITE_TRANSLATE_KEY;
    const AZURE_ENDPOINT =
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";
    const AZURE_REGION = import.meta.env.VITE_TRANSLATE_REGION;

    // Category display names - same as in customer.tsx
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

    const getProducts = () => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((res_json) => {
                const updatedProducts = res_json.map((product: Product) => ({
                    ...product,
                    originalName: product.name,
                    image_url: imgPath(product.img_src),
                }));
                setProducts(updatedProducts);
            })
            .catch((error) => {
                console.error("Error fetching products:", error);
            });
    };

    useEffect(() => {
        getProducts();
    }, []);

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

    // Translation effect - similar to customer.tsx
    useEffect(() => {
        const labels = [
            "Menu Board",
            "Back",
            "Popular Items",
            "All Drinks",
            "Ice Cream",
            "Miscellaneous",
            "Accessibility",
            "Text+",
            "Text-",
            "Translate",
            "Calories",
            "Loading products...",
            "No image",
            "Image not available",
            ...Object.values(categoryDisplayNames),
            ...products.map((p) => p.name),
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

    // Update product names with translations
    useEffect(() => {
        const translated = products.map((p) => ({
            ...p,
            originalName: p.originalName || p.name,
            name: translatedText[p.name] || p.name,
        }));
        setTranslatedProducts(translated);
    }, [translatedText, products]);

    const increaseFontSize = () => {
        setFontSize((prevSize) => Math.min(prevSize + 4, 28));
    };
    const decreaseFontSize = () => {
        setFontSize((prevSize) => Math.max(prevSize - 4, 16));
    };

    const drinkTypes = [
        "milk_tea",
        "fruit_tea",
        "brewed_tea",
        "fresh_milk",
        "ice_blended",
        "tea_mojito",
        "creama",
    ];

    // Helper function to translate text
    const t = (key: string) => translatedText[key] || key;

    // Filter products using translated products
    const popularItems = translatedProducts.filter(
        (p) => p.product_type === "special_item",
    );
    const allDrinks = translatedProducts.filter((p) =>
        drinkTypes.includes(p.product_type),
    );
    const iceCreamItems = translatedProducts.filter(
        (p) => p.product_type === "ice_cream",
    );
    const miscItems = translatedProducts.filter(
        (p) => p.product_type === "misc",
    );

    return (
        <div className="flex justify-center min-h-screen bg-gray-100 inset-0">
            <div className="max-w-screen-2xl w-full p-5">
                {/* Top bar */}
                <div className="flex justify-between items-center mb-4">
                    {/* Back Button */}
                    <button
                        className="flex items-center w-auto h-10 px-4 bg-gray-200 rounded-lg cursor-pointer"
                        onClick={() => router.history.back()} // Navigate back
                    >
                        <img
                            width="25"
                            className="mr-2"
                            src="left-arrow.svg"
                            alt="Back"
                        />
                        <div className="font-bold">{t("Back")}</div>
                    </button>

                    {/* Accessability Selector */}
                    <button onClick={() => setShowAccessibilityModal(true)}>
                        <img className="w-8 cursor-pointer" src="./world.svg" />
                    </button>
                </div>

                <h1
                    className="text-3xl font-bold text-center mb-6"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {t("Menu Board")}
                </h1>
                {translatedProducts.length === 0 ? (
                    <p
                        className="text-center text-gray-500"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {t("Loading products...")}
                    </p>
                ) : (
                    <div className="grid grid-cols-3 grid-rows-[auto_1fr_auto] gap-6">
                        {/* Popular Items */}
                        <div className="col-span-1 row-span-1 bg-white p-4 rounded-md shadow-md">
                            <h2
                                className="text-2xl font-bold mb-4"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {t("Popular Items")}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {popularItems.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex flex-col items-center p-2 rounded-lg transition-colors"
                                    >
                                        {product.image_url ? (
                                            <div
                                                className="mb-2 rounded-full overflow-hidden"
                                                style={{
                                                    width: `${fontSize * 4.5 + 20}px`,
                                                    height: `${fontSize * 4.5 + 20}px`,
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/api/placeholder/150/150";
                                                        e.currentTarget.alt = t(
                                                            "Image not available",
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-24 h-24 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span
                                                    className="text-gray-400"
                                                    style={{
                                                        fontSize: `${fontSize}px`,
                                                    }}
                                                >
                                                    {t("No image")}
                                                </span>
                                            </div>
                                        )}
                                        <span
                                            className="text-lg font-semibold text-center"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {product.name}
                                        </span>
                                        <span
                                            className="text-lg"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {centsToDollars(product.price)}
                                            {showCalories &&
                                                ` • ${product.calories} cal`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* All Drinks */}
                        <div className="col-span-2 row-span-3 bg-white p-4 rounded-md shadow-md">
                            <h2
                                className="text-xl font-bold mb-3"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {t("All Drinks")}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {allDrinks.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex flex-col items-center p-2 rounded-lg transition-colors"
                                    >
                                        {product.image_url ? (
                                            <div
                                                className="mb-0.1 rounded-full overflow-hidden"
                                                style={{
                                                    width: `${fontSize * 3 + 20}px`,
                                                    height: `${fontSize * 3 + 20}px`,
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/api/placeholder/80/80";
                                                        e.currentTarget.alt = t(
                                                            "Image not available",
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span
                                                    className="text-xs text-gray-400"
                                                    style={{
                                                        fontSize: `${fontSize}px`,
                                                    }}
                                                >
                                                    {t("No image")}
                                                </span>
                                            </div>
                                        )}
                                        <span
                                            className="font-medium text-center text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {t(product.name)}
                                        </span>
                                        <span
                                            className="text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {centsToDollars(product.price)}
                                            {showCalories &&
                                                ` • ${product.calories} cal`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ice Cream Box */}
                        <div className="col-spa-1 bg-white p-4 rounded-md shadow-md">
                            <h2
                                className="text-xl font-bold mb-3"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {t("Ice Cream")}
                            </h2>
                            <div className="grid grid-cols-2 gap-2">
                                {iceCreamItems.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex flex-col items-center p-2"
                                    >
                                        {product.image_url ? (
                                            <div
                                                className="mb-2 rounded-full overflow-hidden"
                                                style={{
                                                    width: `${fontSize * 3.5 + 20}px`,
                                                    height: `${fontSize * 3.5 + 20}px`,
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/api/placeholder/80/80";
                                                        e.currentTarget.alt = t(
                                                            "Image not available",
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span
                                                    className="text-xs text-gray-400"
                                                    style={{
                                                        fontSize: `${fontSize}px`,
                                                    }}
                                                >
                                                    {t("No image")}
                                                </span>
                                            </div>
                                        )}
                                        <span
                                            className="font-medium text-center text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {product.name}
                                        </span>
                                        <span
                                            className="text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {centsToDollars(product.price)}
                                            {showCalories &&
                                                ` • ${product.calories} cal`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Miscellaneous Box */}
                        <div className="bg-white p-4 rounded-md shadow-md">
                            <h2
                                className="text-xl font-bold mb-3"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {t("Miscellaneous")}
                            </h2>
                            <div className="grid grid-cols-2 gap-2">
                                {miscItems.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex flex-col items-center p-2"
                                    >
                                        {product.image_url ? (
                                            <div
                                                className="mb-2 rounded-full overflow-hidden"
                                                style={{
                                                    width: `${fontSize * 3.5 + 20}px`,
                                                    height: `${fontSize * 3.5 + 20}px`,
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/api/placeholder/80/80";
                                                        e.currentTarget.alt = t(
                                                            "Image not available",
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span
                                                    className="text-xs text-gray-400"
                                                    style={{
                                                        fontSize: `${fontSize}px`,
                                                    }}
                                                >
                                                    {t("No image")}
                                                </span>
                                            </div>
                                        )}
                                        <span
                                            className="font-medium text-center text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {product.name}
                                        </span>
                                        <span
                                            className="text-sm"
                                            style={{
                                                fontSize: `${fontSize}px`,
                                            }}
                                        >
                                            {centsToDollars(product.price)}
                                            {showCalories &&
                                                ` • ${product.calories} cal`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showAccessibilityModal}
                onRequestClose={() => setShowAccessibilityModal(false)}
                contentLabel="Accessibility"
                className="w-full max-w-xl mx-auto mt-20 bg-white p-6 rounded-xl shadow-xl"
            >
                <h2 className="text-2xl font-bold mb-4">Accessibility</h2>
                <span className="mr-2">Language:</span>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageKey)}
                    className="border px-4 py-2 rounded"
                >
                    {Object.entries(languages).map(([value, displayName]) => (
                        <option key={value} value={value}>
                            {displayName}
                        </option>
                    ))}
                </select>
                <div className="flex items-center mt-4">
                    <div className="mr-2">Font Size:</div>
                    <button onClick={decreaseFontSize}>
                        <img
                            src="minus.svg"
                            width="20"
                            className="mr-2 mt-0.5 border rounded-xl cursor-pointer"
                        />
                    </button>
                    <div>{fontSize}</div>
                    <button onClick={increaseFontSize}>
                        <img
                            src="plus.svg"
                            width="20"
                            className="ml-2 mt-0.5 border rounded-xl cursor-pointer"
                        />
                    </button>
                </div>
                <button
                    className="mt-4 bg-gray-100 p-3 rounded hover:bg-gray-300 cursor-pointer"
                    onClick={() => setShowCalories((sc) => !sc)}
                >
                    {showCalories ? "Hide " : "Show "} Calories
                </button>
            </Modal>
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
