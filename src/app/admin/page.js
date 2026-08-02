"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_SECTIONS = [
  {
    id: "sec_queridinhos",
    title: "Os Queridinhos 😍",
    layout: "carousel",
    items: []
  }
];

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState("orders"); 

  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [toppings, setToppings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalImage, setModalImage] = useState(null);

  const knownOrdersRef = useRef(new Set());
  const isFirstLoad = useRef(true);

  const playAlert = () => {
    if (typeof window === "undefined") return;
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playNote = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; 
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.8, ctx.currentTime + startTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      playNote(523.25, 0, 0.6);     
      playNote(659.25, 0.4, 1.2);   
    } catch (e) { console.log("Áudio bloqueado pelo navegador."); }
  };

  useEffect(() => {
    const isLogged = sessionStorage.getItem("admin_logged");
    if (isLogged === "true") setIsAuthenticated(true);

    async function loadAdminData() {
      const { data: secData } = await supabase.from('store_config').select('value').eq('key', 'sections').single();
      if (secData && secData.value) setSections(secData.value);

      const { data: topData } = await supabase.from('store_config').select('value').eq('key', 'toppings').single();
      if (topData && topData.value) setToppings(topData.value);

      const { data: orderData } = await supabase.from('orders').select('*');
      if (orderData) {
        const formattedOrders = orderData.map(o => o.order_data);
        formattedOrders.sort((a, b) => b.id - a.id);
        formattedOrders.forEach(o => knownOrdersRef.current.add(o.id));
        setOrders(formattedOrders);
      }

      const { data: custData } = await supabase.from('customers').select('*');
      if (custData) {
        const formattedCustomers = custData.map(c => c.customer_data);
        setCustomers(formattedCustomers);
      }
      isFirstLoad.current = false;
    }
    loadAdminData();

    const adminRadar = setInterval(async () => {
      if (sessionStorage.getItem("admin_logged") !== "true") return;

      const { data: orderData } = await supabase.from('orders').select('*');
      if (orderData) {
        const formattedOrders = orderData.map(o => o.order_data);
        formattedOrders.sort((a, b) => b.id - a.id);
        
        let newOrderArrived = false;
        formattedOrders.forEach(o => {
          if (!knownOrdersRef.current.has(o.id)) {
            knownOrdersRef.current.add(o.id); 
            if (o.status === 'aguardando') newOrderArrived = true;
          }
        });
        if (newOrderArrived && !isFirstLoad.current) playAlert();
        setOrders(prev => JSON.stringify(prev) !== JSON.stringify(formattedOrders) ? formattedOrders : prev);
      }

      const { data: custData } = await supabase.from('customers').select('*');
      if (custData) {
        const formattedCustomers = custData.map(c => c.customer_data);
        setCustomers(prev => JSON.stringify(prev) !== JSON.stringify(formattedCustomers) ? formattedCustomers : prev);
      }
    }, 3000);

    return () => clearInterval(adminRadar);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput === "pedacinho@admin" && passwordInput === "pedacinhoadmin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_logged", "true");
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_logged");
  };

  const saveAllChanges = async () => {
    await supabase.from('store_config').upsert({ key: 'sections', value: sections });
    await supabase.from('store_config').upsert({ key: 'toppings', value: toppings });
    alert("Alterações salvas na nuvem com sucesso!");
  };

  // GERENCIAMENTO DE SEÇÕES E PRODUTOS
  const addNewSection = () => setSections([...sections, { id: Date.now().toString(), title: "Nova Seção 🌟", layout: "vertical", items: [] }]);
  const removeSection = (secId) => { if (confirm("Apagar esta seção inteira?")) setSections(sections.filter(s => s.id !== secId)); };
  const updateSectionTitle = (secId, newTitle) => setSections(sections.map(s => s.id === secId ? { ...s, title: newTitle } : s));
  const updateSectionLayout = (secId, newLayout) => setSections(sections.map(s => s.id === secId ? { ...s, layout: newLayout } : s));
  const addItemToSection = (secId) => {
    const newItem = { id: Date.now().toString(), name: "Novo Produto", description: "", price: 15.0, image: null, maxToppings: null, warningText: "", isCombo: false, sizes: [] };
    setSections(sections.map(s => s.id === secId ? { ...s, items: [...s.items, newItem] } : s));
  };
  const removeItemFromSection = (secId, itemId) => setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s));
  const updateItemInSec = (secId, itemId, field, value) => setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : s));

  // NOVO: GERENCIAMENTO DE TAMANHOS/ML POR PRODUTO
  const addSizeToItem = (secId, itemId) => {
    setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, sizes: [...(i.sizes || []), { id: Date.now().toString(), name: "300ml", price: 15.0, freeLimit: 3 }] } : i) } : s));
  };
  const updateSizeInItem = (secId, itemId, sizeId, field, value) => {
    setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, sizes: i.sizes.map(sz => sz.id === sizeId ? { ...sz, [field]: value } : sz) } : i) } : s));
  };
  const removeSizeFromItem = (secId, itemId, sizeId) => {
    setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, sizes: i.sizes.filter(sz => sz.id !== sizeId) } : i) } : s));
  };

  const handleProductImageUpload = (secId, itemId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateItemInSec(secId, itemId, 'image', reader.result);
    reader.readAsDataURL(file);
  };

  const addTopping = (isPremium) => setToppings([...toppings, { id: Date.now().toString(), name: isPremium ? "Novo Adicional Pago" : "Novo Acompanhamento", price: isPremium ? 2.0 : 0, premium: isPremium }]);
  const removeTopping = (id) => setToppings(toppings.filter(t => t.id !== id));
  const updateTopping = (id, field, value) => setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));

  const updateOrderStatus = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    const targetOrder = updated.find(o => o.id === orderId);
    if (targetOrder) await supabase.from('orders').upsert({ id: orderId.toString(), order_data: targetOrder });
  };

  const advanceOrderStep = (orderId, currentStatus) => {
    const flow = { 'aguardando': 'producao', 'producao': 'entrega', 'entrega': 'finalizado' };
    const nextStatus = flow[currentStatus];
    if (nextStatus) updateOrderStatus(orderId, nextStatus);
  };

  const deleteOrder = async (orderId, isCancel = false) => {
    const msg = isCancel ? "🚨 Tem certeza que deseja CANCELAR este pedido? O cliente será notificado na hora e os pontos dele serão revertidos." : "🗑️ Tem certeza que deseja EXCLUIR este pedido permanentemente?";
    if (confirm(msg)) {
      const orderTarget = orders.find(o => o.id === orderId);
      if (isCancel) {
        const updatedOrder = { ...orderTarget, status: 'cancelado' };
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
        await supabase.from('orders').upsert({ id: orderId.toString(), order_data: updatedOrder });
      } else {
        setOrders(orders.filter(o => o.id !== orderId));
        await supabase.from('orders').delete().eq('id', orderId.toString());
      }
      if (orderTarget && orderTarget.status !== 'cancelado' && orderTarget.email) {
        const { data: custData } = await supabase.from('customers').select('*').eq('email', orderTarget.email).single();
        if (custData && custData.customer_data) {
          let cData = custData.customer_data;
          cData.totalOrders = Math.max(0, (cData.totalOrders || 1) - 1);
          cData.totalSpent = Math.max(0, (cData.totalSpent || orderTarget.total) - orderTarget.total);
          await supabase.from('customers').upsert({ email: orderTarget.email, customer_data: cData });
        }
      }
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'finalizado' && o.status !== 'cancelado');
  const completedOrders = orders.filter(o => o.status === 'finalizado' || o.status === 'cancelado');

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const currentMonthStr = todayStr.substring(3, 10); 

  const todaysCompletedOrders = completedOrders.filter(o => o.status === 'finalizado' && o.date && o.date.startsWith(todayStr));
  const todaysTotal = todaysCompletedOrders.reduce((acc, o) => acc + o.total, 0);

  const monthCompletedOrders = completedOrders.filter(o => o.status === 'finalizado' && o.date && o.date.substring(3, 10) === currentMonthStr);
  const monthTotal = monthCompletedOrders.reduce((acc, o) => acc + o.total, 0);

  const getPast7DaysChartData = () => {
    const data = [];
    let weekTotal = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('pt-BR'); 
      const displayDate = dateString.substring(0, 5); 
      const dayOrders = completedOrders.filter(o => o.status === 'finalizado' && o.date && o.date.startsWith(dateString));
      const dayTotal = dayOrders.reduce((acc, o) => acc + o.total, 0);
      weekTotal += dayTotal;
      data.push({ date: displayDate, total: dayTotal });
    }
    return { data, weekTotal };
  };

  const chartInfo = getPast7DaysChartData();
  const maxChartVal = Math.max(...chartInfo.data.map(d => d.total), 1); 

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 font-black text-xl">🔒</div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">Área Restrita 🔒</h1>
          <form onSubmit={handleLogin} className="w-full space-y-4 mt-4">
            <div><input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Usuário" className="w-full p-3 border rounded-xl font-medium bg-slate-50 text-sm" required /></div>
            <div><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Senha" className="w-full p-3 border rounded-xl font-medium bg-slate-50 text-sm" required /></div>
            {loginError && <p className="text-xs font-bold text-red-500 text-center">Incorreto!</p>}
            <button type="submit" className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg mt-2">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans relative">
      {modalImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full flex flex-col items-center relative shadow-2xl">
            <button onClick={() => setModalImage(null)} className="absolute top-3 right-3 bg-slate-100 text-slate-700 p-2 rounded-full font-bold">✕ Fechar</button>
            <h3 className="font-black text-slate-800 mb-3 mt-2">Visualização da Imagem</h3>
            <img src={modalImage} alt="Ampliada" className="w-full max-h-[70vh] object-contain rounded-xl border" />
          </div>
        </div>
      )}

      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div><h1 className="text-xl font-black">Painel Admin</h1></div>
        <div className="flex gap-3">
          <button onClick={playAlert} className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl">🔔 Testar Som</button>
          <a href="/" target="_blank" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl">Ver Loja</a>
          <button onClick={handleLogout} className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-2 rounded-xl">Sair</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab("orders")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Pedidos ({activeOrders.length}) ⏳</button>
          <button onClick={() => setActiveTab("completed_orders")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'completed_orders' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Finalizados ({completedOrders.length}) ✅</button>
          <button onClick={() => setActiveTab("sections")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'sections' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Cardápio 📂</button>
          <button onClick={() => setActiveTab("toppings")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'toppings' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Acompanhamentos 🍓</button>
          <button onClick={() => setActiveTab("premium_toppings")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'premium_toppings' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Adicionais Pagos 💰</button>
          <button onClick={() => setActiveTab("customers")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'customers' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Clientes 👥</button>
          <button onClick={() => setActiveTab("dashboard")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Dashboard 📊</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-6">

        {/* ABA: CARDÁPIO */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button onClick={addNewSection} className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs">+ Nova Seção</button>
              <button onClick={saveAllChanges} className="bg-green-600 text-white font-black px-6 py-2.5 rounded-xl text-xs">Salvar Alterações 💾</button>
            </div>
            {sections.map((sec) => (
              <div key={sec.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex gap-2 items-center flex-wrap pb-3 border-b border-slate-100">
                  <input type="text" value={sec.title} onChange={(e) => updateSectionTitle(sec.id, e.target.value)} className="flex-1 p-2.5 border rounded-xl font-black text-base text-slate-800 bg-slate-50" />
                  <select value={sec.layout} onChange={(e) => updateSectionLayout(sec.id, e.target.value)} className="p-2.5 border rounded-xl font-bold text-xs bg-slate-50">
                    <option value="vertical">Lista Vertical</option>
                    <option value="carousel">Carrossel (Efeito Roxo)</option>
                  </select>
                  <button onClick={() => removeSection(sec.id)} className="bg-red-100 text-red-600 px-3 py-2.5 rounded-xl font-bold text-xs">🗑️</button>
                </div>

                <div className="space-y-4 pl-2 sm:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-600 uppercase">Produtos</span>
                    <button onClick={() => addItemToSection(sec.id)} className="bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-lg">+ Produto</button>
                  </div>
                  
                  {sec.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex gap-3 items-start flex-wrap sm:flex-nowrap">
                        <label className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center border-2 border-dashed border-orange-300">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="text-[10px] text-orange-600 font-bold text-center">Adicionar<br/>Foto</span>}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(sec.id, item.id, e)} />
                        </label>
                        
                        <div className="flex-1 flex flex-col gap-2 w-full">
                          <div className="flex gap-2">
                            <input type="text" value={item.name} onChange={(e) => updateItemInSec(sec.id, item.id, 'name', e.target.value)} className="flex-1 p-2 border border-slate-200 rounded-lg text-sm font-bold bg-white" placeholder="Nome do Produto" />
                            <input type="number" value={item.price} onChange={(e) => updateItemInSec(sec.id, item.id, 'price', Number(e.target.value))} className="w-24 p-2 border border-slate-200 rounded-lg text-sm font-bold text-orange-600 bg-white text-center" title="Preço Base (Aparece se não tiver Tamanhos)" placeholder="R$" />
                          </div>
                          <input type="text" value={item.description || ""} onChange={(e) => updateItemInSec(sec.id, item.id, 'description', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white" placeholder="Descrição ou Itens do Combo" />
                        </div>
                        <button onClick={() => removeItemFromSection(sec.id, item.id)} className="bg-red-100 text-red-600 p-2.5 rounded-xl font-bold text-xs h-[fit-content]">🗑️</button>
                      </div>

                      <div className="flex gap-2 items-end flex-wrap mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Máx. Acomp.</span>
                          <input type="number" value={item.maxToppings || ""} disabled={item.isCombo} onChange={(e) => updateItemInSec(sec.id, item.id, 'maxToppings', Number(e.target.value))} className="w-24 p-2 border border-slate-200 rounded-lg text-xs font-bold text-center bg-white disabled:opacity-50" placeholder="Global" title="Limite Padrão (se não usar Tamanhos)" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-[150px]">
                          <span className="text-[10px] font-bold text-red-500 uppercase">Aviso em Vermelho</span>
                          <input type="text" value={item.warningText || ""} onChange={(e) => updateItemInSec(sec.id, item.id, 'warningText', e.target.value)} className="w-full p-2 border border-red-200 rounded-lg text-xs bg-red-50 text-red-700 placeholder-red-300" placeholder="Ex: Itens não podem ser alterados." />
                        </div>
                        
                        <label className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={item.isCombo || false} onChange={(e) => updateItemInSec(sec.id, item.id, 'isCombo', e.target.checked)} className="w-4 h-4 rounded text-orange-500" />
                          <span className="text-xs font-bold text-slate-700">É Combo? (Oculta Acomp. Grátis)</span>
                        </label>
                      </div>

                      {/* NOVO: BLOCO DE TAMANHOS / ML */}
                      <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[11px] font-black text-purple-700 uppercase">Tamanhos / ML (Opcional)</span>
                          <button onClick={() => addSizeToItem(sec.id, item.id)} className="bg-purple-100 text-purple-700 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-purple-200">+ Adicionar Tamanho</button>
                        </div>
                        
                        {(item.sizes || []).map((size) => (
                          <div key={size.id} className="flex gap-2 items-center mb-2 bg-purple-50 p-2 rounded-lg border border-purple-100">
                            <div className="flex-1 flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Nome (ex: 500ml)</span>
                              <input type="text" value={size.name} onChange={(e) => updateSizeInItem(sec.id, item.id, size.id, 'name', e.target.value)} className="w-full p-1.5 rounded border border-purple-200 text-xs font-bold" />
                            </div>
                            <div className="w-20 flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Preço</span>
                              <input type="number" value={size.price} onChange={(e) => updateSizeInItem(sec.id, item.id, size.id, 'price', Number(e.target.value))} className="w-full p-1.5 rounded border border-purple-200 text-xs font-bold text-orange-600" />
                            </div>
                            <div className="w-24 flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 uppercase" title="Quantidade de acompanhamentos grátis para este tamanho">Máx Acomp.</span>
                              <input type="number" value={size.freeLimit || ""} disabled={item.isCombo} onChange={(e) => updateSizeInItem(sec.id, item.id, size.id, 'freeLimit', Number(e.target.value))} className="w-full p-1.5 rounded border border-purple-200 text-xs font-bold text-center disabled:opacity-50" placeholder="Ex: 5" />
                            </div>
                            <button onClick={() => removeSizeFromItem(sec.id, item.id, size.id)} className="mt-3 p-1.5 text-red-500 hover:bg-red-100 rounded">🗑️</button>
                          </div>
                        ))}
                        {(!item.sizes || item.sizes.length === 0) && (
                          <p className="text-[10px] text-slate-400 italic">Nenhum tamanho cadastrado. O produto usará o preço e limite padrão.</p>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA: PEDIDOS ATIVOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Pedidos em Andamento (Tempo Real) 📡</h2>
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum pedido ativo no momento.</div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col gap-4 animate-slide-up">
                    <div className={`absolute top-0 left-0 w-2 h-full ${order.status === 'aguardando' ? 'bg-orange-500' : order.status === 'producao' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <span className="font-black text-lg text-slate-900">Pedido #{order.id}</span>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <span className="font-black text-orange-600 text-lg">R$ {order.total.toFixed(2)}</span>
                    </div>

                    <div className="pl-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm flex flex-col gap-1">
                      <p className="font-bold text-slate-800">Cliente: {order.customer || "Não informado"} ({order.email || "Sem e-mail"})</p>
                      <p className="text-slate-600">Endereço: {order.address || "Não informado"}</p>
                      <p className="text-xs font-bold text-[#32BCAD] mt-1">Pagamento: {order.payment || "Pix"}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-200 font-medium text-xs text-slate-700">
                        {order.items.map((i, idx) => (
                          <div key={idx}>
                            • {i.item.name} {i.size ? <span className="text-purple-600 font-black">[{i.size.name}]</span> : ''} {i.toppings.length > 0 ? <span className="text-slate-500 font-normal">({i.toppings.map(t=>t.name).join(', ')})</span> : ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.pixReceipt && (
                      <div className="pl-2">
                        <button onClick={() => setModalImage(order.pixReceipt)} className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-teal-100 transition-colors">
                          <span>🧾 Ver Comprovante Pix</span>
                        </button>
                      </div>
                    )}

                    <div className="pl-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => advanceOrderStep(order.id, order.status)} 
                        className={`flex-1 py-4 rounded-xl font-black text-sm shadow-md transition-all ${
                          order.status === 'aguardando' ? 'bg-pink-500 text-white hover:bg-pink-600' :
                          order.status === 'producao' ? 'bg-blue-500 text-white hover:bg-blue-600' :
                          'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {order.status === 'aguardando' && 'Avançar para: Em Produção 🧁'}
                        {order.status === 'producao' && 'Avançar para: Saiu para Entrega 🚀'}
                        {order.status === 'entrega' && 'Concluir Pedido (Finalizar) ✅'}
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id, true)} 
                        className="sm:w-auto w-full px-6 py-4 rounded-xl font-black text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>❌</span> Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: PEDIDOS FINALIZADOS */}
        {activeTab === "completed_orders" && (
          <div className="space-y-6 pb-24 relative">
            <h2 className="text-lg font-black text-slate-800">Histórico de Pedidos Finalizados ✅</h2>
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum pedido finalizado ainda.</div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${order.status === 'cancelado' ? 'border-red-100' : 'border-slate-200'} relative overflow-hidden flex flex-col gap-4 opacity-75 hover:opacity-100 transition-opacity`}>
                    <div className={`absolute top-0 left-0 w-2 h-full ${order.status === 'cancelado' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-lg text-slate-900 line-through ${order.status === 'cancelado' ? 'decoration-red-500' : 'decoration-green-500'}`}>Pedido #{order.id}</span>
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${order.status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {order.status === 'cancelado' ? 'Cancelado' : 'Finalizado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <span className={`font-black text-lg ${order.status === 'cancelado' ? 'text-red-400' : 'text-slate-400'}`}>R$ {order.total.toFixed(2)}</span>
                    </div>

                    <div className="pl-2 flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Reverter status do pedido:</p>
                      <div className="flex gap-2">
                        <button onClick={() => updateOrderStatus(order.id, 'aguardando')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-orange-100 hover:text-orange-600">Aguardando</button>
                        <button onClick={() => updateOrderStatus(order.id, 'producao')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-pink-100 hover:text-pink-600">Produção</button>
                        <button onClick={() => updateOrderStatus(order.id, 'entrega')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-100 hover:text-blue-600">Entrega</button>
                      </div>

                      <button 
                        onClick={() => deleteOrder(order.id, false)} 
                        className="mt-2 w-full py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>🗑️</span> Excluir Pedido Permanentemente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completedOrders.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 p-5 rounded-2xl mt-8 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10 text-6xl">💵</div>
                <div className="relative z-10">
                  <h3 className="font-black text-green-800 text-lg sm:text-xl">Caixa de Hoje ({todayStr.substring(0, 5)})</h3>
                  <p className="text-xs sm:text-sm text-green-700 font-bold mt-1">Subtotal de {todaysCompletedOrders.length} pedido(s) c/ sucesso</p>
                </div>
                <span className="relative z-10 font-black text-2xl sm:text-3xl text-green-600">R$ {todaysTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* OUTRAS ABAS (Acompanhamentos, Adicionais, Clientes, Dashboard) INTACTAS */}
        
        {activeTab === "toppings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-800">Acompanhamentos Grátis 🍓</h2>
                <p className="text-xs text-slate-500">Itens que entram no limite máximo do açaí.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addTopping(false)} className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Acompanhamento</button>
                <button onClick={saveAllChanges} className="bg-green-600 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar 💾</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              {toppings.filter(t => !t.premium).map((t) => (
                <div key={t.id} className="flex gap-3 items-center border-b border-slate-100 pb-3">
                  <input type="text" value={t.name} onChange={(e) => updateTopping(t.id, 'name', e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold" />
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">Grátis</span>
                  <button onClick={() => removeTopping(t.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "premium_toppings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-800">Adicionais Pagos 💰</h2>
                <p className="text-xs text-slate-500">Itens cobrados à parte (Sem limite de escolha).</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addTopping(true)} className="bg-purple-600 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Adicional Pago</button>
                <button onClick={saveAllChanges} className="bg-green-600 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar 💾</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              {toppings.filter(t => t.premium).map((t) => (
                <div key={t.id} className="flex gap-3 items-center border-b border-slate-100 pb-3">
                  <input type="text" value={t.name} onChange={(e) => updateTopping(t.id, 'name', e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold" />
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1.5 rounded-lg">R$</span>
                  <input type="number" value={t.price} onChange={(e) => updateTopping(t.id, 'price', Number(e.target.value))} className="w-20 p-2 border rounded-lg text-sm font-bold text-orange-600" />
                  <button onClick={() => removeTopping(t.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Clube de Fidelidade & Clientes 👥</h2>
            {customers.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum cliente cadastrado na nuvem ainda.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customers.map((cust, idx) => {
                  const ordersCount = cust.totalOrders || 0;
                  const targetOrders = 5;
                  const progress = Math.min((ordersCount / targetOrders) * 100, 100);

                  return (
                    <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-slate-900 text-lg">{cust.name}</h3>
                          <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-full">{ordersCount}ª compra</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">✉️ {cust.email}</p>
                        <p className="text-xs font-bold text-slate-700 mt-2">Total Gasto: R$ {(cust.totalSpent || 0).toFixed(2)}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span>Progresso para Desconto</span>
                          <span>{ordersCount} / {targetOrders} pedidos</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-pink-500 to-orange-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {ordersCount >= targetOrders ? '🎉 Cliente apto para resgatar o desconto!' : `Faltam ${targetOrders - ordersCount} pedido(s) para a recompensa.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-lg font-black text-slate-800">Visão Geral de Vendas 🚀</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-5 rounded-2xl shadow text-white flex flex-col justify-between">
                <span className="text-sm font-bold opacity-80 uppercase tracking-wide">Faturamento Hoje</span>
                <div className="mt-2">
                  <span className="text-3xl font-black">R$ {todaysTotal.toFixed(2)}</span>
                  <p className="text-xs mt-1 font-medium opacity-90">{todaysCompletedOrders.length} pedidos finalizados</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-5 rounded-2xl shadow text-white flex flex-col justify-between">
                <span className="text-sm font-bold opacity-80 uppercase tracking-wide">Últimos 7 Dias</span>
                <div className="mt-2">
                  <span className="text-3xl font-black">R$ {chartInfo.weekTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-5 rounded-2xl shadow text-white flex flex-col justify-between">
                <span className="text-sm font-bold opacity-80 uppercase tracking-wide">Mês Atual</span>
                <div className="mt-2">
                  <span className="text-3xl font-black">R$ {monthTotal.toFixed(2)}</span>
                  <p className="text-xs mt-1 font-medium opacity-90">{monthCompletedOrders.length} pedidos neste mês</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-black text-slate-800 mb-6">Gráfico: Vendas dos Últimos 7 Dias</h3>
              
              <div className="flex items-end justify-between h-48 gap-2 mt-4 pt-4 border-t border-slate-100">
                {chartInfo.data.map((d, i) => {
                  const heightPercent = (d.total / maxChartVal) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end">
                      <div className="w-full relative flex justify-center flex-1 items-end">
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-10">
                          R$ {d.total.toFixed(2)}
                        </div>
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-orange-400 to-pink-500 rounded-t-lg transition-all duration-700 hover:opacity-80" 
                          style={{ height: `${heightPercent}%`, minHeight: d.total > 0 ? '5%' : '0%' }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-3">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}