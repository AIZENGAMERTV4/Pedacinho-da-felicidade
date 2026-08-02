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
  const [isOpen, setIsOpen] = useState(true); 
  const [buildingItem, setBuildingItem] = useState(null);
  
  // NOVO: Estado para salvar o tamanho selecionado pelo cliente
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);

  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [toppings, setToppings] = useState(DEFAULT_TOPPINGS);

  const [loggedCustomer, setLoggedCustomer] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState("email"); 
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPixScreenOpen, setIsPixScreenOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null); 
  const [orderHistory, setOrderHistory] = useState([]);

  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [receiptFile, setReceiptFile] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    async function loadDataFromSupabase() {
      const { data: secData } = await supabase.from('store_config').select('value').eq('key', 'sections').single();
      if (secData && secData.value) setSections(secData.value);

      const { data: topData } = await supabase.from('store_config').select('value').eq('key', 'toppings').single();
      if (topData && topData.value) setToppings(topData.value);
    }
    loadDataFromSupabase();

    const savedCustomer = localStorage.getItem("pedacinho_customer");
    if (savedCustomer) setLoggedCustomer(JSON.parse(savedCustomer));

    const savedOrders = localStorage.getItem("pedacinho_orders");
    if (savedOrders) setOrderHistory(JSON.parse(savedOrders));

    const checkStatus = () => { setIsOpen(true); };
    checkStatus(); 
    const interval = setInterval(checkStatus, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (activeOrder && activeOrder.status !== 'finalizado' && activeOrder.status !== 'cancelado') {
      interval = setInterval(async () => {
        const { data } = await supabase.from('orders').select('*').eq('id', activeOrder.id).single();
        if (data && data.order_data) {
          if (data.order_data.status !== activeOrder.status) {
            setActiveOrder(data.order_data);
            setOrderHistory(prevHistory => {
              const updatedHistory = prevHistory.map(o => o.id === data.order_data.id ? data.order_data : o);
              localStorage.setItem("pedacinho_orders", JSON.stringify(updatedHistory));
              return updatedHistory;
            });
          }
        }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [activeOrder]);

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginName) {
      alert("Por favor, preencha seu nome e e-mail!");
      return;
    }
    setIsAuthLoading(true);

    const { data: existingCustomer } = await supabase.from('customers').select('*').eq('email', loginEmail).maybeSingle();

    if (existingCustomer && existingCustomer.customer_data) {
      let cData = existingCustomer.customer_data;
      cData.name = loginName; 
      await supabase.from('customers').upsert({ email: loginEmail, customer_data: cData }, { onConflict: 'email' });
      
      setLoggedCustomer(cData);
      localStorage.setItem("pedacinho_customer", JSON.stringify(cData));
      
      setIsAuthLoading(false);
      setIsLoginModalOpen(false);
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email: loginEmail });
      setIsAuthLoading(false);
      
      if (error) {
        alert("Erro ao enviar o código de verificação. Verifique se o e-mail está correto.");
      } else {
        setAuthStep("code"); 
      }
    }
  };

  const verifyLoginCode = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email: loginEmail, token: loginCode, type: 'email' });
    setIsAuthLoading(false);

    if (error) {
      alert("Código inválido ou expirado! Tente novamente.");
      return;
    }

    if (data.session) {
      const newCustomer = {
        email: loginEmail,
        name: loginName,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null
      };
      await supabase.from('customers').upsert({ email: loginEmail, customer_data: newCustomer }, { onConflict: 'email' });
      
      setLoggedCustomer(newCustomer);
      localStorage.setItem("pedacinho_customer", JSON.stringify(newCustomer));
      
      setIsLoginModalOpen(false);
      setAuthStep("email");
      setLoginCode("");
    }
  };

  const handleLogoutCustomer = async () => {
    await supabase.auth.signOut();
    setLoggedCustomer(null);
    localStorage.removeItem("pedacinho_customer");
  };

  const openBuilder = (item) => {
    if (!isOpen) {
      alert("Poxa! Estamos fechados no momento. Nosso horário de funcionamento é das 10:30 às 21:59.");
      return;
    }
    setBuildingItem(item);
    
    // Se o item tem tamanhos, seleciona o primeiro por padrão
    if (item.sizes && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0]);
    } else {
      setSelectedSize(null);
    }
    
    setSelectedToppings([]); 
  };

  const toggleTopping = (topping) => {
    if (selectedToppings.find((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      if (!topping.premium) {
        const freeSelectedCount = selectedToppings.filter(t => !t.premium).length;
        
        // NOVO: A inteligência puxa o limite do tamanho selecionado. Se não tiver, puxa do produto.
        const maxLimit = selectedSize?.freeLimit ?? buildingItem.maxToppings ?? buildingItem.freeLimit ?? 3;
        
        if (freeSelectedCount >= maxLimit) {
          alert(`Você só pode escolher no máximo ${maxLimit} acompanhamentos.`);
          return;
        }
      }
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculateItemPrice = () => {
    if (!buildingItem) return 0;
    
    // O valor base agora é o preço do Tamanho (se existir), ou o preço padrão do item
    let total = selectedSize ? selectedSize.price : buildingItem.price;
    
    selectedToppings.forEach((t) => {
      if (t.premium) total += t.price;
    });
    return total;
  };

  const confirmItemToCart = () => {
    const finalPrice = calculateItemPrice();
    setCart([...cart, { 
      cartId: Math.random().toString(36).substr(2, 9), 
      item: buildingItem, 
      size: selectedSize, // Salva o tamanho selecionado no carrinho
      toppings: [...selectedToppings], 
      price: finalPrice, 
      quantity: 1 
    }]);
    setBuildingItem(null); 
    setSelectedSize(null);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + DELIVERY_FEE : 0;

  const handleStartCheckout = () => {
    if (cartSubtotal < MINIMUM_ORDER) {
      alert(`O pedido mínimo é de R$ ${MINIMUM_ORDER.toFixed(2).replace('.', ',')} (sem contar a entrega). Por favor, adicione mais itens!`);
      return;
    }
    if (!loggedCustomer) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = () => {
    if (!customerAddress) {
      alert("Por favor, preencha seu endereço para entrega!");
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
      customer: loggedCustomer.name,
      email: loggedCustomer.email,
      address: customerAddress,
      payment: paymentMethod,
      pixReceipt: receiptImage,
      deliveryPhoto: null
    };
    
    await supabase.from('orders').upsert({ id: orderId, order_data: newOrder }, { onConflict: 'id' });

    const { data: currentCust } = await supabase.from('customers').select('*').eq('email', loggedCustomer.email).maybeSingle();
    let baseData = currentCust?.customer_data || loggedCustomer;

    const updatedCustomer = {
      ...baseData,
      name: loggedCustomer.name, 
      totalOrders: (baseData.totalOrders || 0) + 1,
      totalSpent: (baseData.totalSpent || 0) + cartTotal,
      lastOrderDate: new Date().toLocaleDateString('pt-BR')
    };
    await supabase.from('customers').upsert({ email: loggedCustomer.email, customer_data: updatedCustomer }, { onConflict: 'email' });
    setLoggedCustomer(updatedCustomer);
    localStorage.setItem("pedacinho_customer", JSON.stringify(updatedCustomer));

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
    if (status === 'cancelado') return 'Cancelado ❌';
    return status;
  };

  if (activeOrder) {
    return (
      <div className={`min-h-screen ${activeOrder.status === 'cancelado' ? 'bg-red-50' : 'bg-orange-50'} flex flex-col items-center pt-10 px-6 font-sans transition-colors duration-500`}>
        <button onClick={() => setActiveOrder(null)} className="absolute top-4 right-4 p-3 bg-white shadow-sm border border-orange-100 text-orange-600 rounded-full hover:bg-orange-50 transition-colors z-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <img src="/pedacinhadafelicidade.jpg" alt="Logo" className="w-48 object-contain mb-8 mix-blend-multiply" />
        
        {activeOrder.status === 'cancelado' ? (
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border-2 border-red-200 relative overflow-hidden text-center animate-slide-up">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm">❌</div>
            <h2 className="text-2xl font-black text-red-600 mb-2">Pedido Cancelado</h2>
            <p className="text-sm text-slate-600 mb-6 font-medium">Infelizmente este pedido foi cancelado pelo estabelecimento. Entre em contato pelo WhatsApp para mais detalhes ou dúvidas.</p>
            <button onClick={() => setActiveOrder(null)} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-xl shadow-sm hover:bg-red-100 transition-colors">Voltar à Loja</button>
          </div>
        ) : (
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 border border-orange-100 relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
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
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-32 font-sans selection:bg-purple-200">
      <header className="relative px-4 pt-4 pb-5 text-center shadow-sm flex flex-col items-center justify-center overflow-hidden border-b border-orange-100">
        <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('/pedacinhadafelicidade.jpg')" }}></div>
        <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-md"></div>
        
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {loggedCustomer ? (
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-orange-200 shadow-sm">
              <span className="text-xs font-bold text-slate-800">Olá, {loggedCustomer.name.split(" ")[0]}! 💜</span>
              <button onClick={handleLogoutCustomer} className="text-[10px] text-red-500 font-bold hover:underline">Sair</button>
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-xl border border-orange-200 shadow-sm text-xs font-bold text-orange-600">
            Entrar
            </button>
          )}

          <button onClick={() => setIsHistoryOpen(true)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-orange-200 shadow-sm hover:bg-orange-50 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span className="text-[9px] font-black text-orange-600 uppercase mt-1">Pedidos</span>
          </button>
        </div>

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
              <span className="text-[11px] font-bold text-orange-800">24 Horas (Testes)</span>
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
              <div className="px-4 mb-3 flex items-baseline justify-between">
                <h2 className="text-xl font-black text-orange-950">{sec.title}</h2>
              </div>
              
              <div className="flex overflow-x-auto gap-4 px-4 pb-6 snap-x [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                {sec.items.map((item) => {
                  // NOVO: Calcula o menor preço se houver tamanhos cadastrados
                  const minPrice = item.sizes && item.sizes.length > 0 ? Math.min(...item.sizes.map(s => s.price)) : null;

                  return (
                  <div key={item.id} className="relative min-w-[190px] max-w-[210px] rounded-2xl snap-center shrink-0 p-[2px] overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.4)] group">
                    
                    <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_135deg,#9333ea_180deg,transparent_180deg,transparent_315deg,#c084fc_360deg)] opacity-100 blur-[3px]"></div>

                    <div className="relative bg-white w-full h-full rounded-[14px] p-2.5 flex flex-col z-10">
                      <div className="relative h-36 mb-2">
                        <img src={item.image || "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=600"} alt={item.name} className={`w-full h-full object-cover rounded-xl border-[3px] ${item.borderColor || 'border-purple-500'}`} />
                        {item.tag && <span className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.tagColor || 'bg-purple-500'}`}>{item.tag}</span>}
                      </div>
                      
                      <h3 className="font-bold text-base text-slate-800 leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex-grow line-clamp-2">{item.description}</p>
                      
                      {item.warningText && <p className="text-[10px] font-black text-red-600 mt-1">{item.warningText}</p>}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-50">
                        {/* Se tiver tamanhos, mostra "A partir de R$" */}
                        {minPrice !== null ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">A partir de</span>
                            <span className="text-purple-600 font-black text-lg leading-tight">R$ {minPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-purple-600 font-black text-lg">R$ {Number(item.price).toFixed(2)}</span>
                        )}
                        <button onClick={() => openBuilder(item)} className="bg-[#FFD100] text-yellow-900 font-bold px-4 py-1.5 rounded-full text-xs active:scale-95 shadow-sm hover:scale-105 transition-transform">Pedir</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        }

        return (
          <section key={sec.id} className="pt-6 px-4 max-w-md mx-auto">
            <div className="mb-4"><h2 className="text-xl font-black text-orange-950">{sec.title}</h2></div>
            <div className="flex flex-col gap-3">
              {sec.items.map((item) => {
                const minPrice = item.sizes && item.sizes.length > 0 ? Math.min(...item.sizes.map(s => s.price)) : null;

                return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3 flex gap-4 h-[120px]">
                  <div className="h-full w-24 shrink-0"><img src={item.image || "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=300"} alt={item.name} className="w-full h-full object-cover rounded-xl border border-orange-50" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-[15px] leading-tight">{item.name}</h3>
                      <p className="text-[13px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                      {item.warningText && <p className="text-[11px] font-black text-red-600 mt-1">{item.warningText}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      {minPrice !== null ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">A partir de</span>
                          <span className="text-orange-600 font-black text-base leading-tight">R$ {minPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-orange-600 font-black text-base">R$ {Number(item.price).toFixed(2)}</span>
                      )}
                      <button onClick={() => openBuilder(item)} className="bg-[#FFD100] text-yellow-900 font-bold px-5 py-1.5 rounded-full text-xs active:scale-95 hover:scale-105 transition-transform">Pedir</button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* MODAL DE LOGIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center relative animate-slide-up">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 p-2 bg-orange-50 border border-orange-100 text-slate-600 rounded-full">✕</button>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 text-purple-600 font-black text-xl">
              {authStep === "email" ? "👤" : "🔐"}
            </div>
            
            {authStep === "email" ? (
              <>
                <h2 className="text-xl font-black text-slate-800 mb-1">Identifique-se</h2>
                <p className="text-xs text-slate-500 mb-6 text-center">Clientes antigos entram direto. Novos clientes validam o e-mail para ganhar descontos! 💜</p>
                <form onSubmit={handleCustomerLogin} className="w-full space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Seu Nome</label>
                    <input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="Ex: Maria Silva" className="w-full p-3 border rounded-xl text-sm font-medium bg-slate-50 focus:border-purple-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Seu E-mail</label>
                    <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" className="w-full p-3 border rounded-xl text-sm font-medium bg-slate-50 focus:border-purple-500 outline-none" required />
                  </div>
                  <button type="submit" disabled={isAuthLoading} className={`w-full font-black py-3 rounded-xl shadow-lg mt-2 ${isAuthLoading ? 'bg-slate-200 text-slate-500' : 'bg-[#FFD100] text-yellow-900 hover:scale-105 transition-transform'}`}>
                    {isAuthLoading ? 'Verificando...' : 'Entrar na Loja 🚀'}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={verifyLoginCode} className="w-full space-y-3">
                <h2 className="text-xl font-black text-slate-800 mb-1 text-center">Bem-vindo(a) à loja!</h2>
                <p className="text-xs font-bold text-green-600 bg-green-50 p-2 rounded-lg text-center mb-3">Enviamos um código de 6 dígitos para o seu e-mail para verificar seu acesso.</p>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Código de Segurança</label>
                  <input type="text" maxLength="6" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="000000" className="w-full p-3 border rounded-xl text-center tracking-[0.5em] font-black text-xl bg-slate-50 focus:border-purple-500 outline-none" required />
                </div>
                <button type="submit" disabled={isAuthLoading} className={`w-full font-black py-3 rounded-xl shadow-lg mt-2 ${isAuthLoading ? 'bg-slate-200 text-slate-500' : 'bg-[#FFD100] text-yellow-900 hover:scale-105 transition-transform'}`}>
                  {isAuthLoading ? 'Verificando...' : 'Confirmar e Entrar ✅'}
                </button>
                <button type="button" onClick={() => setAuthStep("email")} className="w-full text-xs font-bold text-slate-500 mt-2 hover:underline">Voltar</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONSTRUÇÃO DO PEDIDO (COM TAMANHOS) */}
      {buildingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[480px] max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800">Montar {buildingItem.name.split(" -")[0]}</h2>
                <p className="text-xs text-orange-600 font-medium">Personalize seu pedido.</p>
                {buildingItem.warningText && <p className="text-xs font-black text-red-600 mt-1">{buildingItem.warningText}</p>}
              </div>
              <button onClick={() => setBuildingItem(null)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">✕</button>
            </div>

            <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              
              {/* NOVA SEÇÃO: ESCOLHA O TAMANHO */}
              {buildingItem.sizes && buildingItem.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-black text-slate-700 mb-3 uppercase tracking-wide flex justify-between items-center">
                    <span>Escolha o Tamanho/ML</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">Obrigatório</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {buildingItem.sizes.map((size) => (
                      <button key={size.id} onClick={() => setSelectedSize(size)} className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${selectedSize?.id === size.id ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white shadow-sm hover:border-purple-200"}`}>
                        <div className="flex flex-col">
                          <span className={`font-bold ${selectedSize?.id === size.id ? "text-purple-900" : "text-slate-700"}`}>{size.name}</span>
                          {size.freeLimit ? <span className="text-[10px] font-bold text-slate-400 mt-0.5">Direito a {size.freeLimit} acompanhamentos</span> : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-purple-600">R$ {size.price.toFixed(2)}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${selectedSize?.id === size.id ? "bg-purple-500 border-purple-500" : "border-slate-300 bg-white"}`}>
                            {selectedSize?.id === size.id && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {buildingItem.isCombo ? (
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 text-center mb-6">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">🔒</div>
                  <p className="text-sm font-black text-slate-800 mb-1">Combo/Copo Fechado</p>
                  <p className="text-xs text-slate-600">Os itens já estão inclusos e não podem ser alterados:</p>
                  <p className="text-sm font-black text-orange-600 mt-3 bg-white p-3 rounded-xl border border-orange-100 shadow-sm">{buildingItem.description}</p>
                </div>
              ) : (
                <div className="mb-6">
                  
                  {/* SEÇÃO 1: ACOMPANHAMENTOS GRÁTIS */}
                  <div className="mb-6">
                    <h3 className="text-sm font-black text-slate-700 mb-3 uppercase tracking-wide flex justify-between items-center">
                      <span>Acompanhamentos</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">
                        {selectedToppings.filter(x => !x.premium).length} / {selectedSize?.freeLimit ?? buildingItem.maxToppings ?? buildingItem.freeLimit ?? 3}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {toppings.filter(t => !t.premium).map((t) => {
                        const isSelected = selectedToppings.find((x) => x.id === t.id);
                        return (
                          <button key={t.id} onClick={() => toggleTopping(t)} className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${isSelected ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white shadow-sm hover:border-purple-200"}`}>
                            <div className="flex flex-col">
                              <span className={`font-bold ${isSelected ? "text-purple-900" : "text-slate-700"}`}>{t.name}</span>
                              <span className={`text-xs font-bold mt-1 ${isSelected ? "text-purple-500" : "text-slate-400"}`}>Grátis</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? "bg-purple-500 border-purple-500" : "border-slate-200 bg-slate-50"}`}>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200 mb-6"></div>

                  {/* SEÇÃO 2: ADICIONAIS PAGOS */}
                  <div>
                    <h3 className="text-sm font-black text-slate-700 mb-3 uppercase tracking-wide">Adicionais Pagos 💰</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {toppings.filter(t => t.premium).map((t) => {
                        const isSelected = selectedToppings.find((x) => x.id === t.id);
                        return (
                          <button key={t.id} onClick={() => toggleTopping(t)} className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${isSelected ? "border-orange-500 bg-orange-50" : "border-slate-100 bg-white shadow-sm hover:border-orange-200"}`}>
                            <div className="flex flex-col">
                              <span className={`font-bold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{t.name}</span>
                              <span className="text-xs font-bold mt-1 text-orange-500">+ R$ {Number(t.price).toFixed(2)}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? "bg-orange-500 border-orange-500" : "border-slate-200 bg-slate-50"}`}>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="p-4 border-t border-orange-100 bg-white shrink-0">
              <button onClick={confirmItemToCart} className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg flex justify-between items-center px-6 text-lg hover:scale-[1.02] transition-transform">
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
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {orderHistory.length === 0 ? (
                <div className="text-center py-10"><h3 className="font-bold text-slate-700">Nenhum pedido ainda</h3></div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orderHistory.map((order) => (
                    <button key={order.id} onClick={() => { setActiveOrder(order); setIsHistoryOpen(false); }} className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${order.status === 'aguardando' ? 'bg-orange-500' : order.status === 'producao' ? 'bg-pink-500' : order.status === 'entrega' ? 'bg-blue-500' : order.status === 'cancelado' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className={`font-black text-lg ${order.status === 'cancelado' ? 'text-red-500 line-through' : 'text-slate-800'}`}>Pedido #{order.id}</span>
                        <span className={`font-bold ${order.status === 'cancelado' ? 'text-slate-400' : 'text-slate-800'}`}>R$ {order.total.toFixed(2)}</span>
                      </div>
                      <div className="pl-2 flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{order.date}</span>
                        <span className={`text-xs font-bold ${order.status === 'finalizado' ? 'text-green-600' : order.status === 'cancelado' ? 'text-red-500' : 'text-orange-600'}`}>
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
            <button onClick={handleStartCheckout} className="bg-[#FFD100] text-yellow-900 px-8 py-4 rounded-full font-black text-lg shadow-lg hover:scale-105 transition-transform">
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
              <h2 className="text-xl font-black text-slate-800">Finalizar Pedido</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-white border border-orange-100 text-slate-600 rounded-full">✕</button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
                <h3 className="font-black text-orange-600 mb-2">📍 Endereço de Entrega</h3>
                <p className="text-xs text-slate-600 mb-3">Cliente: <b>{loggedCustomer?.name}</b> ({loggedCustomer?.email})</p>
                <div className="space-y-3">
                  <textarea placeholder="Seu Endereço (Rua, Número, Bairro, Ponto de Referência)" rows="3" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full p-3 rounded-xl border border-orange-200 bg-white font-medium text-sm" />
                  
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

              <button onClick={handleCheckoutSubmit} className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg text-lg hover:scale-[1.02] transition-transform">
                Fazer Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIX SCREEN */}
      {isPixScreenOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center relative">
            <button onClick={() => setIsPixScreenOpen(false)} className="absolute top-4 right-4 p-2 bg-orange-50 border border-orange-100 text-slate-600 rounded-full">✕</button>
            <h2 className="text-xl font-black text-slate-800 mb-1">Pagamento via Pix</h2>
            <div className="text-3xl font-black text-[#32BCAD] mb-6">R$ {cartTotal.toFixed(2)}</div>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-600 truncate mr-2">{PIX_KEY}</span>
              <button onClick={copyPixKey} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs">{pixCopied ? "Copiado!" : "Copiar"}</button>
            </div>
            <div className="w-full mb-6">
              <label className="block w-full border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-xl p-4 text-center cursor-pointer hover:bg-orange-100 transition-colors">
                <span className="text-sm font-bold text-orange-600 block mb-1">{receiptFile ? "Comprovante Anexado ✅" : "Anexar Comprovante"}</span>
                <span className="text-xs text-slate-400">{receiptFile ? receiptFile.name : "Obrigatório para enviar o pedido"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceiptFile(e.target.files[0])} />
              </label>
            </div>
            <button onClick={submitReceipt} disabled={!receiptFile} className={`w-full py-4 rounded-xl font-black text-lg transition-all ${receiptFile ? 'bg-[#32BCAD] text-white shadow-lg hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Enviar Comprovante e Fazer Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}