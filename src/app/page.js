"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_SECTIONS = [
  {
    id: "sec_queridinhos",
    title: "Os Queridinhos 😍",
    layout: "carousel",
    items: [
      { id: "p1", name: "Explosão de Alegria", description: "Açaí, Leite Ninho, Morango fresco e Leite Condensado", price: 22.0, image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=600", tag: "Mais Vendido", tagColor: "bg-orange-500", borderColor: "border-orange-500", freeLimit: 3 },
      { id: "p2", name: "Especial Luiza", description: "Açaí, Nutella na borda, pedaços de Brownie e Morango", price: 28.0, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=600", tag: "Nossa Especialidade", tagColor: "bg-pink-500", borderColor: "border-pink-500", freeLimit: 3 },
      { id: "p3", name: "Taça Céu Azul", description: "Açaí, Creme de Cupuaçu, Banana, Kiwi e Granola", price: 24.0, image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600", tag: "Refrescante", tagColor: "bg-blue-500", borderColor: "border-blue-500", freeLimit: 3 }
    ]
  }
];

const DEFAULT_TOPPINGS = [
  { id: "t1", name: "Leite Ninho", price: 0, premium: false },
  { id: "t2", name: "Granola Crocante", price: 0, premium: false },
  { id: "t3", name: "Morango", price: 0, premium: false },
  { id: "t4", name: "Banana", price: 0, premium: false },
  { id: "t5", name: "Paçoca", price: 0, premium: false },
  { id: "t6", name: "Leite Condensado", price: 0, premium: false },
  { id: "t7", name: "Nutella Extra", price: 4.0, premium: true },
  { id: "t8", name: "Ouro Branco", price: 3.0, premium: true },
];

const DELIVERY_FEE = 5.0; 
const MINIMUM_ORDER = 20.0; 
const PIX_KEY = "74999580828"; 

export default function PedacinhoDeFelicidade() {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [buildingItem, setBuildingItem] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);

  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [toppings, setToppings] = useState(DEFAULT_TOPPINGS);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPixScreenOpen, setIsPixScreenOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null); 
  const [orderHistory, setOrderHistory] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [receiptFile, setReceiptFile] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    async function loadDataFromSupabase() {
      // Carregar seções
      const { data: secData } = await supabase.from('store_config').select('value').eq('key', 'sections').single();
      if (secData && secData.value) setSections(secData.value);

      // Carregar adicionais
      const { data: topData } = await supabase.from('store_config').select('value').eq('key', 'toppings').single();
      if (topData && topData.value) setToppings(topData.value);
    }
    loadDataFromSupabase();

    const savedOrders = localStorage.getItem("pedacinho_orders");
    if (savedOrders) setOrderHistory(JSON.parse(savedOrders));

    const checkStatus = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); 
      setIsOpen(currentTime >= (13 * 60 + 30) && currentTime <= (21 * 60 + 59));
    };
    checkStatus(); 
    const interval = setInterval(checkStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  const openBuilder = (item) => {
    if (!isOpen) {
      alert("Poxa! Estamos fechados no momento. Nosso horário é das 13:30 às 21:59.");
      return;
    }
    setBuildingItem(item);
    setSelectedToppings([]); 
  };

  const toggleTopping = (topping) => {
    if (selectedToppings.find((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculateItemPrice = () => {
    if (!buildingItem) return 0;
    let total = buildingItem.price;
    let standardCount = 0;
    selectedToppings.forEach((t) => {
      if (t.premium) {
        total += t.price;
      } else {
        standardCount++;
        if (standardCount > (buildingItem.freeLimit || 3)) total += 2.0; 
      }
    });
    return total;
  };

  const confirmItemToCart = () => {
    const finalPrice = calculateItemPrice();
    setCart([...cart, { cartId: Math.random().toString(36).substr(2, 9), item: buildingItem, toppings: [...selectedToppings], price: finalPrice, quantity: 1 }]);
    setBuildingItem(null); 
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + DELIVERY_FEE : 0;

  const handleCheckoutSubmit = () => {
    if (cartSubtotal < MINIMUM_ORDER) {
      alert(`O pedido mínimo é de R$ ${MINIMUM_ORDER.toFixed(2).replace('.', ',')} (sem contar a entrega). Por favor, adicione mais itens!`);
      return;
    }
    if (!customerName || !customerAddress) {
      alert("Por favor, preencha seu nome e endereço para entrega!");
      return;
    }
    setIsCheckoutOpen(false); 
    if (paymentMethod === "Pix") {
      setIsPixScreenOpen(true); 
    } else {
      createActiveOrder("aguardando", null);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const submitReceipt = () => {
    if (!receiptFile) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Receipt = reader.result;
      setIsPixScreenOpen(false);
      await createActiveOrder("aguardando", base64Receipt);
    };
    reader.readAsDataURL(receiptFile);
  };

  const createActiveOrder = async (status, receiptImage) => {
    const orderId = Math.floor(Math.random() * 10000).toString();
    const newOrder = {
      id: orderId, 
      date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      items: [...cart],
      total: cartTotal,
      status: status,
      customer: customerName,
      address: customerAddress,
      payment: paymentMethod,
      pixReceipt: receiptImage,
      deliveryPhoto: null
    };
    
    // Salvar no Supabase para o Admin ver na hora
    await supabase.from('orders').upsert({ id: orderId, order_data: newOrder });

    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem("pedacinho_orders", JSON.stringify(updatedHistory));
    
    setActiveOrder(newOrder); 
    setCart([]); 
  };

  const getStatusText = (status) => {
    if (status === 'aguardando') return 'Aguardando Confirmação';
    if (status === 'producao') return 'Em Produção';
    if (status === 'entrega') return 'Saiu para Entrega';
    if (status === 'finalizado') return 'Finalizado ✅';
    return status;
  };

  if (activeOrder) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center pt-10 px-6 font-sans">
        <button onClick={() => setActiveOrder(null)} className="absolute top-4 right-4 p-3 bg-white shadow-sm border border-orange-100 text-orange-600 rounded-full hover:bg-orange-50 transition-colors z-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <img src="/pedacinhadafelicidade.jpg" alt="Logo" className="w-48 object-contain mb-8 mix-blend-multiply" />
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-orange-500 to-green-500"></div>
          <h2 className="text-2xl font-black text-orange-950 text-center mt-2 mb-1">Pedido #{activeOrder.id}</h2>
          <p className="text-center text-orange-600/80 text-sm mb-6">Acompanhe o status em tempo real</p>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-orange-100">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${['aguardando','producao','entrega','finalizado'].includes(activeOrder.status) ? 'bg-orange-500' : 'bg-orange-100'}`}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-orange-100 bg-orange-50/50 shadow-sm">
                <h3 className="font-bold text-base text-orange-600">1. Aguardando Confirmação</h3>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${['producao','entrega','finalizado'].includes(activeOrder.status) ? 'bg-pink-500' : 'bg-orange-100'}`}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-orange-100 bg-white shadow-sm">
                <h3 className={`font-bold text-base ${['producao','entrega','finalizado'].includes(activeOrder.status) ? 'text-pink-600' : 'text-orange-300'}`}>2. Em Produção</h3>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${['entrega','finalizado'].includes(activeOrder.status) ? 'bg-blue-500' : 'bg-orange-100'}`}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-orange-100 bg-white shadow-sm">
                <h3 className={`font-bold text-base ${['entrega','finalizado'].includes(activeOrder.status) ? 'text-blue-600' : 'text-orange-300'}`}>3. Saiu para Entrega</h3>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${activeOrder.status === 'finalizado' ? 'bg-green-500' : 'bg-orange-100'}`}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-orange-100 bg-white shadow-sm">
                <h3 className={`font-bold text-base ${activeOrder.status === 'finalizado' ? 'text-green-600' : 'text-orange-300'}`}>4. Finalizado ✅</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-32 font-sans selection:bg-pink-200">
      <header className="relative px-4 pt-4 pb-5 text-center shadow-sm flex flex-col items-center justify-center overflow-hidden border-b border-orange-100">
        <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('/IMG-20260730-WA0114.jpg')" }}></div>
        <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-md"></div>
        
        <button onClick={() => setIsHistoryOpen(true)} className="absolute top-4 right-4 z-20 flex flex-col items-center justify-center p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-orange-200 shadow-sm hover:bg-orange-50 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span className="text-[9px] font-black text-orange-600 uppercase mt-1">Pedidos</span>
        </button>

        <div className="relative z-10 flex flex-col items-center w-full mt-2">
          <img src="/pedacinhadafelicidade.jpg" alt="Logo" className="w-56 h-20 sm:w-64 sm:h-24 object-cover object-center drop-shadow-sm mix-blend-multiply" />
          <p className="text-orange-600 font-bold text-sm -mt-1 mb-3">Sua dose diária de alegria 💜</p>
          
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <span className={`text-[11px] font-black uppercase tracking-wider ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
                  {isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              <div className="w-px h-3 bg-orange-200"></div>
              <span className="text-[11px] font-bold text-orange-800">13:30 - 21:59</span>
            </div>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide bg-white/60 px-3 py-0.5 rounded-full backdrop-blur-sm">
              Pedido Mínimo: R$ {MINIMUM_ORDER.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </header>

      {/* RENDERIZAÇÃO DAS SEÇÕES */}
      {sections.map((sec) => {
        if (!sec.items || sec.items.length === 0) return null;
        if (sec.layout === 'carousel') {
          return (
            <section key={sec.id} className="pt-6">
              <div className="px-4 mb-3 flex items-baseline justify-between"><h2 className="text-xl font-black text-orange-950">{sec.title}</h2></div>
              <div className="flex overflow-x-auto gap-3 px-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                {sec.items.map((item) => (
                  <div key={item.id} className="min-w-[190px] max-w-[210px] bg-white rounded-2xl shadow-sm border border-orange-100 p-2.5 snap-center shrink-0 flex flex-col">
                    <div className="relative h-36 mb-2">
                      <img src={item.image || "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=600"} alt={item.name} className={`w-full h-full object-cover rounded-xl border-[3px] ${item.borderColor || 'border-orange-500'}`} />
                      {item.tag && <span className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.tagColor || 'bg-orange-500'}`}>{item.tag}</span>}
                    </div>
                    <h3 className="font-bold text-base text-slate-800 leading-tight">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex-grow line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-orange-50">
                      <span className="text-orange-600 font-black text-lg">R$ {Number(item.price).toFixed(2)}</span>
                      <button onClick={() => openBuilder(item)} className="bg-[#FFD100] text-yellow-900 font-bold px-4 py-1.5 rounded-full text-xs active:scale-95 shadow-sm">Pedir</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        return (
          <section key={sec.id} className="pt-6 px-4 max-w-md mx-auto">
            <div className="mb-4"><h2 className="text-xl font-black text-orange-950">{sec.title}</h2></div>
            <div className="flex flex-col gap-3">
              {sec.items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3 flex gap-4 h-[120px]">
                  <div className="h-full w-24 shrink-0"><img src={item.image || "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=300"} alt={item.name} className="w-full h-full object-cover rounded-xl border border-orange-50" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-[15px] leading-tight">{item.name}</h3>
                      <p className="text-[13px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-orange-600 font-black text-base">R$ {Number(item.price).toFixed(2)}</span>
                      <button onClick={() => openBuilder(item)} className="bg-[#FFD100] text-yellow-900 font-bold px-5 py-1.5 rounded-full text-xs active:scale-95">Pedir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* MODAL DE ACOMPANHAMENTOS */}
      {buildingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[480px] max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800">Montar {buildingItem.name.split(" -")[0]}</h2>
                <p className="text-xs text-orange-600 font-medium">Direito a {buildingItem.freeLimit || 3} itens grátis.</p>
              </div>
              <button onClick={() => setBuildingItem(null)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {toppings.map((t) => {
                  const isSelected = selectedToppings.find((x) => x.id === t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTopping(t)} className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${isSelected ? (t.premium ? "border-orange-500 bg-orange-50" : "border-pink-500 bg-pink-50") : "border-slate-100 bg-white shadow-sm"}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{t.name}</span>
                        <span className={`text-xs font-bold mt-1 ${t.premium ? "text-orange-500" : "text-slate-400"}`}>{t.premium ? `+ R$ ${Number(t.price).toFixed(2)}` : (isSelected ? "Adicionado" : "Grátis*")}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? (t.premium ? "bg-orange-500 border-orange-500" : "bg-pink-500 border-pink-500") : "border-slate-200 bg-slate-50"}`}>
                        {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 bg-white">
              <button onClick={confirmItemToCart} className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg flex justify-between items-center px-6 text-lg">
                <span>Colocar no Carrinho</span>
                <span>R$ {calculateItemPrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[480px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
              <h2 className="text-xl font-black text-slate-800">Meus Pedidos</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {orderHistory.length === 0 ? (
                <div className="text-center py-10"><h3 className="font-bold text-slate-700">Nenhum pedido ainda</h3></div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orderHistory.map((order) => (
                    <button key={order.id} onClick={() => { setActiveOrder(order); setIsHistoryOpen(false); }} className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${order.status === 'aguardando' ? 'bg-orange-500' : order.status === 'producao' ? 'bg-pink-500' : order.status === 'entrega' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className="font-black text-slate-800 text-lg">Pedido #{order.id}</span>
                        <span className="font-bold text-slate-800">R$ {order.total.toFixed(2)}</span>
                      </div>
                      <div className="pl-2 flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{order.date}</span>
                        <span className={`text-xs font-bold ${order.status === 'finalizado' ? 'text-green-600' : 'text-orange-600'}`}>
                          Status: {getStatusText(order.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARRINHO */}
      {cart.length > 0 && !isCheckoutOpen && !isPixScreenOpen && !isHistoryOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 shadow-xl z-20 rounded-t-3xl border-t border-orange-100">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-orange-600 font-bold uppercase">{cart.length} item(s)</span>
              <span className="text-slate-800 font-black text-2xl">R$ {cartSubtotal.toFixed(2)}</span>
            </div>
            <button onClick={() => setIsCheckoutOpen(true)} className="bg-[#FFD100] text-yellow-900 px-8 py-4 rounded-full font-black text-lg shadow-lg">
              Ver Pedido
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[480px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
              <h2 className="text-xl font-black text-slate-800">Seu Pedido</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
                <h3 className="font-black text-orange-600 mb-4">📍 Para onde vamos mandar?</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Seu Nome Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 rounded-xl border border-orange-200 bg-white font-medium" />
                  <textarea placeholder="Seu Endereço (Rua, Número, Bairro)" rows="2" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full p-3 rounded-xl border border-orange-200 bg-white font-medium" />
                  
                  <div className="pt-2">
                    <span className="text-sm font-bold text-slate-700 block mb-2">Forma de Pagamento:</span>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 rounded-xl border border-orange-200 bg-white font-bold text-slate-800">
                      <option value="Pix">Pix (Copia e Cola)</option>
                      <option value="Cartão">Cartão na Entrega</option>
                      <option value="Dinheiro">Dinheiro na Entrega</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6 bg-orange-50/30 p-4 rounded-2xl border border-orange-100">
                <div className="flex justify-between text-slate-600 font-medium"><span>Subtotal</span><span>R$ {cartSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600 font-medium"><span>Taxa de Entrega</span><span>R$ {DELIVERY_FEE.toFixed(2)}</span></div>
                <div className="flex justify-between text-orange-600 font-black text-xl pt-3 mt-3 border-t border-orange-200"><span>Total</span><span>R$ {cartTotal.toFixed(2)}</span></div>
              </div>

              {cartSubtotal < MINIMUM_ORDER ? (
                <button disabled className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-xl cursor-not-allowed">
                  Faltam R$ {(MINIMUM_ORDER - cartSubtotal).toFixed(2).replace('.', ',')} para o pedido mínimo
                </button>
              ) : (
                <button onClick={handleCheckoutSubmit} className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg text-lg">
                  Finalizar Pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIX SCREEN */}
      {isPixScreenOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center relative">
            <button onClick={() => setIsPixScreenOpen(false)} className="absolute top-4 right-4 p-2 bg-orange-50 border border-orange-100 text-slate-600 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-xl font-black text-slate-800 mb-1">Pagamento via Pix</h2>
            <div className="text-3xl font-black text-[#32BCAD] mb-6">R$ {cartTotal.toFixed(2)}</div>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-600 truncate mr-2">{PIX_KEY}</span>
              <button onClick={copyPixKey} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs">{pixCopied ? "Copiado!" : "Copiar"}</button>
            </div>
            <div className="w-full mb-6">
              <label className="block w-full border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-xl p-4 text-center cursor-pointer">
                <span className="text-sm font-bold text-orange-600 block mb-1">{receiptFile ? "Comprovante Anexado ✅" : "Anexar Comprovante"}</span>
                <span className="text-xs text-slate-400">{receiptFile ? receiptFile.name : "Obrigatório para enviar o pedido"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceiptFile(e.target.files[0])} />
              </label>
            </div>
            <button onClick={submitReceipt} disabled={!receiptFile} className={`w-full py-4 rounded-xl font-black text-lg ${receiptFile ? 'bg-[#32BCAD] text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Enviar Comprovante e Fazer Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}