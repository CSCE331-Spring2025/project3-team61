import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Modal from "react-modal";
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
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  options: string[];
}

function CustomerPage() {
  const [started, setStarted] = useState(false);
  const [language, setLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [translatedProducts, setTranslatedProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sizes = ["Small", "Regular", "Large"];
  const iceLevels = ["No Ice", "Less Ice", "Regular", "Extra Ice"];
  const sugarLevels = ["0%", "25%", "50%", "75%", "100%"];
  const [size, setSize] = useState("Regular");
  const [ice, setIce] = useState("Regular");
  const [sugar, setSugar] = useState("100%");
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("milk_tea");
  const [tapText, setTapText] = useState("Tap to Start");

  //dotenv.config({ path: "../backend/.env" });

  const AZURE_TRANSLATOR_KEY = import.meta.env.VITE_TRANSLATE_KEY;
  const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";
  const AZURE_REGION = import.meta.env.VITE_TRANSLATE_REGION;

  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const WEATHER_API_URL = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=77840&aqi=no`;

  console.log("Api key", WEATHER_API_KEY);

  const [tempLoaded, setTempLoaded] = useState<boolean>(false);
  const [temp, setTemp] = useState<number>(0);
  const [location, setLocation] = useState<string>("")
  const [imageConditionUri, setImageConditionUri] = useState<string>("")

  useEffect(() => {
    fetch(WEATHER_API_URL)
      .then((res) => res.json())
      .then((jsonRes) => {
          setLocation(jsonRes.location.name);
          setTemp(jsonRes.current.temp_f);
          setImageConditionUri("http:" + jsonRes.current.condition.icon);
          setTempLoaded(true);
      })
      .catch((err) => console.error("Failed to fetch weather", err))
  })

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
      "Tap to Start", "Categories", "Choose Your Drink", "Your Order", "Total", "Pay Now",
      "Customize", "Size", "Sugar Level", "Ice Level", "Add to Order",
      ...sizes, ...sugarLevels, ...iceLevels,
      ...products.map((p) => p.name),
      ...Object.values(categoryDisplayNames),
    ];

    const translateWithAzure = async () => {
      if (language === "en") {
        const passthrough: Record<string, string> = {};
        labels.forEach(label => passthrough[label] = label);
        setTranslatedText(passthrough);
        setTapText("Tap to Start");
        return;
      }

      const translated: Record<string, string> = {};
      for (const label of labels) {
        try {
          const res = await fetch(
            `${AZURE_ENDPOINT}&to=${language}`,
            {
              method: "POST",
              headers: {
                "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY!,
                "Ocp-Apim-Subscription-Region": AZURE_REGION,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([{ Text: label }]),
            }
          );
          const json = await res.json();
          translated[label] = json?.[0]?.translations?.[0]?.text || label;
        } catch (err) {
          translated[label] = label;
        }
      }
      setTranslatedText(translated);
      setTapText(translated["Tap to Start"] || "Tap to Start");
    };

    translateWithAzure();
  }, [language, products]);

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
    setModalOpen(true);
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
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const removeOrderItem = (indexToRemove: number) => {
    setOrderItems((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const t = (key: string) => translatedText[key] || key;

  return (
    <div className="relative h-screen">
      {!started && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
          <img src="/Team-61.png" alt="Team 61" className="w-48 mb-6" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mb-6 border px-4 py-2 rounded"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="zh-Hans">中文</option>
            <option value="vi">Tiếng Việt</option>
            <option value="ko">한국어</option>
            <option value="fr">Français (French)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="de">Deutsch (German)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
          <button
            onClick={() => setStarted(true)}
            className="bg-slate-800 text-white px-12 py-6 rounded-full text-3xl shadow-lg hover:bg-slate-700 transition"
          >
            {tapText}
          </button>
        </div>
      )}
      

      {started && (
        <>
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setStarted(false)}
              className="bg-white border border-gray-300 px-4 py-2 rounded-md shadow hover:bg-gray-100"
            >
              ← {t("Back to Start")}
            </button>
            <div className="flex items-center gap-4">
              {tempLoaded && (
                <>
                  <p>{location} {temp} °F</p>
                  <img src={imageConditionUri}/>
                </>
              )}
              <span className="text-sm text-gray-500">
                {t("Current Language")}: {language.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex h-full bg-gray-100">
            {/* Sidebar */}
            <div className="w-60 p-4 bg-white border-r border-gray-300">
              <h2 className="text-lg font-bold mb-4">{t("Categories")}</h2>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        selectedCategory === cat ? "bg-slate-700 text-white" : "hover:bg-gray-100"
                      }`}
                    >
                      {t(categoryDisplayNames[cat])}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product Grid */}
            <div className="w-3/5 p-6 overflow-y-auto">
              <h1 className="text-3xl font-bold mb-6">{t(categoryDisplayNames[selectedCategory])}</h1>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {translatedProducts
                  .filter((p) => p.product_type === selectedCategory)
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => openModal(product)}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                    >
                      <img
                        src={getProductImage(product.originalName || product.name)}
                        alt={product.name}
                        className="w-full h-40 object-contain rounded mb-2"
                      />
                      <div className="text-lg font-semibold">{product.name}</div>
                      <div className="text-sm text-gray-500">{centsToDollars(product.price)}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Cart */}
            <div className="w-1/4 p-6 bg-white border-l border-gray-300 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold mb-4">{t("Your Order")}</h2>
                <div className="space-y-4 overflow-y-auto max-h-96">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded">
                      <div>
                        <div className="font-semibold">
                          {item.name} x {item.quantity}
                        </div>
                        <div className="text-sm text-gray-500">{item.options?.join(", ")}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{centsToDollars(item.price * item.quantity)}</div>
                        <button onClick={() => removeOrderItem(i)}>
                          <img src="/garbage.svg" alt="Delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("Total")}</span>
                  <span>{centsToDollars(totalPrice)}</span>
                </div>
                <button className="w-full bg-slate-800 text-white mt-4 py-3 rounded-md text-lg">
                  {t("Pay Now")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel="Customize Drink"
        className="w-full max-w-xl mx-auto mt-20 bg-white p-6 rounded-xl shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start z-50"
      >
        <h2 className="text-2xl font-bold mb-4">{t("Customize")} {selectedProduct?.name}</h2>
        <div className="mb-3">
          <label className="font-semibold">{t("Size")}</label>
          <OptionButtons options={sizes} value={size} setValue={setSize} t={t} />
        </div>
        <div className="mb-3">
          <label className="font-semibold">{t("Sugar Level")}</label>
          <OptionButtons options={sugarLevels} value={sugar} setValue={setSugar} t={t} />
        </div>
        <div className="mb-3">
          <label className="font-semibold">{t("Ice Level")}</label>
          <OptionButtons options={iceLevels} value={ice} setValue={setIce} t={t} />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-3 items-center">
            <button onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : prev))} className="w-8 h-8 bg-gray-200 rounded">-</button>
            <div className="text-lg">{quantity}</div>
            <button onClick={() => setQuantity((prev) => prev + 1)} className="w-8 h-8 bg-gray-200 rounded">+</button>
          </div>
          <div className="text-lg font-bold">{centsToDollars((selectedProduct?.price || 0) * quantity)}</div>
        </div>
        <button onClick={addToOrder} className="mt-6 bg-slate-800 text-white w-full py-3 rounded-md text-lg">
          {t("Add to Order")}
        </button>
      </Modal>
    </div>
  );
}

function OptionButtons({ options, value, setValue, t }: { options: string[]; value: string; setValue: (v: string) => void; t: (label: string) => string; }) {
  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => setValue(option)}
          className={`px-3 py-2 rounded border ${value === option ? "bg-slate-700 text-white" : "bg-white border-gray-300"}`}
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}

function getProductImage(name: string): string {
  const images: Record<string, string> = {
    "Classic Milk Tea": "/classic_milk_tea.png",
    "Fresh Taro Milk": "/taro_tea.png",
    "Vanilla Ice Cream": "/vanilla.png",
    "Matcha Fresh Milk": "/matcha.png",
    "Mocha Ice Blended": "/mocha-tea.png",
    "Chocolate Ice Cream": "/chocolate.png",
    "Strawberry Ice Cream": "/strawberry.png",
    "Earl Grey Tea": "/earl.png",
    "Jasmine Green Tea": "/jasmine.png",
    "Okinawa Milk Tea": "/okinawa.png",
    "Mango Fruit Tea": "/mango-tea.png",
    "Strawberry Fruit Tea": "/strawberry-tea.png",
    "Caramel Ice Blended": "/caramel-blended.png",
    "Lemon Tea Mojito": "/lemon-moj.png",
    "Passionfruit Tea Mojito": "/passion-moj.png",
    "Black Tea Crema": "/black-crema.png",
    "Oolong Crema": "/oolong.png",
    "Bottled Water": "/water.png",
    "Canned Soda": "/soda.png",
    "Limited Edition Tea": "/limited.png",
    "Pearl Topping": "/pearl.png",
  };
  return images[name] || "/default.png";
}

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

