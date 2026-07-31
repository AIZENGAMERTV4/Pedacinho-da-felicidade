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

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState("sections"); // "sections", "toppings", "orders", "customers"

  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [toppings, setToppings] = useState(DEFAULT_TOPPINGS);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalImage, setModalImage] = useState(null);

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
        setOrders(formattedOrders);
      }

      const { data: custData } = await supabase.from('customers').select('*');
      if (custData) {
        const formattedCustomers = custData.map(c => c.customer_data);
        setCustomers(formattedCustomers);
      }
    }
    loadAdminData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput === "pedacinhodafelicidadeadmin" && passwordInput === "pedacinhoadmin123") {
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
    const { error: err1 } = await supabase.from('store_config').upsert({ key: 'sections', value: sections });
    const { error: err2 } = await supabase.from('store_config').upsert({ key: 'toppings', value: toppings });

    if (err1 || err2) {
      alert("Erro ao salvar no Supabase: " + (err1?.message || err2?.message));
    } else {
      alert("Alterações salvas na nuvem com sucesso! A loja inteira foi atualizada.");
    }
  };

  const addNewSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "Nova Seção 🌟", layout: "vertical", items: [] }]);
  };

  const removeSection = (secId) => {
    if (confirm("Tem certeza que deseja apagar esta seção inteira?")) {
      setSections(sections.filter(s => s.id !== secId));
    }
  };

  const updateSectionTitle = (secId, newTitle) => {
    setSections(sections.map(s => s.id === secId ? { ...s, title: newTitle } : s));
  };

  const updateSectionLayout = (secId, newLayout) => {
    setSections(sections.map(s => s.id === secId ? { ...s, layout: newLayout } : s));
  };

  const addItemToSection = (secId) => {
    const newItem = { 
      id: Date.now().toString(), 
      name: "Novo Produto", 
      description: "Descrição deliciosa", 
      price: 15.0, 
      image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=300", 
      freeLimit: 3 
    };
    setSections(sections.map(s => s.id === secId ? { ...s, items: [...s.items, newItem] } : s));
  };

  const removeItemFromSection = (secId, itemId) => {
    setSections(sections.map(s => s.id === secId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s));
  };

  const updateItemInSec = (secId, itemId, field, value) => {
    setSections(sections.map(s => {
      if (s.id !== secId) return s;
      const updatedItems = s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
      return { ...s, items: updatedItems };
    }));
  };

  const handleProductImageUpload = (secId, itemId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      updateItemInSec(secId, itemId, 'image', base64Image);
    };
    reader.readAsDataURL(file);
  };

  const addTopping = () => {
    setToppings([...toppings, { id: Date.now().toString(), name: "Novo Adicional", price: 0, premium: false }]);
  };

  const removeTopping = (id) => {
    setToppings(toppings.filter(t => t.id !== id));
  };

  const updateTopping = (id, field, value) => {
    setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    const targetOrder = updated.find(o => o.id === orderId);
    if (targetOrder) {
      await supabase.from('orders').upsert({ id: orderId.toString(), order_data: targetOrder });
    }
  };

  const handleDeliveryPhotoUpload = (orderId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const updated = orders.map(o => o.id === orderId ? { ...o, deliveryPhoto: base64Image, status: 'finalizado' } : o);
      setOrders(updated);
      const targetOrder = updated.find(o => o.id === orderId);
      if (targetOrder) {
        await supabase.from('orders').upsert({ id: orderId.toString(), order_data: targetOrder });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 font-black text-xl">🔒</div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">Área Restrita 🔒</h1>
          <p className="text-sm text-slate-500 mb-6 text-center">Entre com os dados da administração para gerenciar a loja.</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome de Usuário</label>
              <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Usuário" className="w-full p-3 border rounded-xl font-medium bg-slate-50 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Senha</label>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Senha" className="w-full p-3 border rounded-xl font-medium bg-slate-50 text-sm" required />
            </div>
            {loginError && <p className="text-xs font-bold text-red-500 text-center">Usuário ou senha incorretos!</p>}
            <button type="submit" className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg mt-2">
              Entrar no Painel
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 w-full text-center">
            <a href="/" className="text-xs font-bold text-orange-600 hover:underline">← Voltar para a Loja</a>
          </div>
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
        <div>
          <h1 className="text-xl font-black">Painel Administrativo 🛠️</h1>
          <p className="text-xs text-slate-400">Um Pedacinho de Felicidade (Supabase Cloud)</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl">Ver Loja 🛍️</a>
          <button onClick={handleLogout} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold px-3 py-2 rounded-xl">Sair 🚪</button>
        </div>
      </header>

      {/* ABAS */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab("sections")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'sections' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Seções & Produtos 📂</button>
          <button onClick={() => setActiveTab("toppings")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'toppings' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Adicionais 🍓</button>
          <button onClick={() => setActiveTab("orders")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Pedidos ({orders.length}) 📦</button>
          <button onClick={() => setActiveTab("customers")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap ${activeTab === 'customers' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>Clientes ({customers.length}) 👥</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* SEÇÕES & PRODUTOS */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button onClick={addNewSection} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Nova Seção</button>
              <button onClick={saveAllChanges} className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar Alterações na Nuvem 💾</button>
            </div>

            {sections.map((sec) => (
              <div key={sec.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex gap-2 items-center flex-wrap pb-3 border-b border-slate-100">
                  <input type="text" value={sec.title} onChange={(e) => updateSectionTitle(sec.id, e.target.value)} className="flex-1 p-2.5 border rounded-xl font-black text-base text-slate-800 bg-slate-50" placeholder="Nome da Seção" />
                  <select value={sec.layout} onChange={(e) => updateSectionLayout(sec.id, e.target.value)} className="p-2.5 border rounded-xl font-bold text-xs bg-slate-50 text-slate-700">
                    <option value="vertical">Lista Vertical</option>
                    <option value="carousel">Carrossel</option>
                  </select>
                  <button onClick={() => removeSection(sec.id)} className="bg-red-100 text-red-600 px-3 py-2.5 rounded-xl font-bold text-xs">🗑️</button>
                </div>

                <div className="space-y-3 pl-2 sm:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-600 uppercase">Produtos ({sec.items.length})</span>
                    <button onClick={() => addItemToSection(sec.id)} className="bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-lg">+ Produto</button>
                  </div>
                  {sec.items.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap sm:flex-nowrap">
                      
                      <label className="w-14 h-14 bg-white rounded-xl overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center border-2 border-dashed border-orange-300 shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt="Produto" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-orange-600 font-bold text-center px-1">Foto 📷</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                          Alterar
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(sec.id, item.id, e)} />
                      </label>

                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <input type="text" value={item.name} onChange={(e) => updateItemInSec(sec.id, item.id, 'name', e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold bg-white text-slate-800" placeholder="Nome do Produto" />
                        <input type="text" value={item.description || ""} onChange={(e) => updateItemInSec(sec.id, item.id, 'description', e.target.value)} className="w-full p-1.5 border rounded-lg text-xs bg-white text-slate-500" placeholder="Descrição" />
                      </div>

                      <input type="number" value={item.price} onChange={(e) => updateItemInSec(sec.id, item.id, 'price', Number(e.target.value))} className="w-24 p-2 border rounded-lg text-sm font-bold text-orange-600 bg-white text-center" placeholder="Preço" />

                      <button onClick={() => removeItemFromSection(sec.id, item.id)} className="bg-red-100 text-red-600 p-2.5 rounded-xl font-bold text-xs hover:bg-red-200">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADICIONAIS */}
        {activeTab === "toppings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Gerenciar Adicionais</h2>
              <div className="flex gap-2">
                <button onClick={addTopping} className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Adicional</button>
                <button onClick={saveAllChanges} className="bg-green-600 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar na Nuvem 💾</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              {toppings.map((t) => (
                <div key={t.id} className="flex gap-3 items-center border-b border-slate-100 pb-3">
                  <input type="text" value={t.name} onChange={(e) => updateTopping(t.id, 'name', e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold text-slate-800" placeholder="Nome" />
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={t.premium} onChange={(e) => updateTopping(t.id, 'premium', e.target.checked)} className="w-4 h-4 rounded text-orange-500" /> Pago?
                  </label>
                  <input type="number" value={t.price} disabled={!t.premium} onChange={(e) => updateTopping(t.id, 'price', Number(e.target.value))} className="w-20 p-2 border rounded-lg text-sm font-bold text-orange-600 disabled:bg-slate-100" placeholder="Preço" />
                  <button onClick={() => removeTopping(t.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Gerenciamento de Pedidos (Tempo Real)</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum pedido recebido na nuvem ainda.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col gap-4">
                    <div className={`absolute top-0 left-0 w-2 h-full ${order.status === 'aguardando' ? 'bg-orange-500' : order.status === 'producao' ? 'bg-pink-500' : order.status === 'entrega' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-slate-900">Pedido #{order.id}</span>
                          {order.status === 'finalizado' && <span className="bg-green-100 text-green-700 font-bold text-[10px] px-2 py-0.5 rounded-full">✓ Finalizado</span>}
                        </div>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <span className="font-black text-orange-600 text-lg">R$ {order.total.toFixed(2)}</span>
                    </div>

                    <div className="pl-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm flex flex-col gap-1">
                      <p className="font-bold text-slate-800">Cliente: {order.customer || "Não informado"} ({order.phone || "Sem tel"})</p>
                      <p className="text-slate-600">Endereço: {order.address || "Não informado"}</p>
                      <p className="text-xs font-bold text-[#32BCAD] mt-1">Forma de Pagamento: {order.payment || "Pix"}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-200 font-medium text-xs text-slate-700">
                        {order.items.map((i, idx) => (
                          <div key={idx}>• {i.item.name} {i.toppings.length > 0 ? `(${i.toppings.map(t=>t.name).join(', ')})` : ''}</div>
                        ))}
                      </div>
                    </div>

                    <div className="pl-2 flex gap-4 items-center flex-wrap">
                      {order.pixReceipt ? (
                        <button onClick={() => setModalImage(order.pixReceipt)} className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-teal-100 transition-colors">
                          <span>🧾 Ver Comprovante Pix</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nenhum comprovante anexado</span>
                      )}

                      {order.deliveryPhoto && (
                        <button onClick={() => setModalImage(order.deliveryPhoto)} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition-colors">
                          <span>📸 Ver Foto da Entrega</span>
                        </button>
                      )}
                    </div>

                    <div className="pl-2 flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 items-center">
                      <div className="flex gap-1 flex-1 w-full">
                        <button onClick={() => updateOrderStatus(order.id, 'aguardando')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'aguardando' ? 'bg-orange-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>1. Aguardando</button>
                        <button onClick={() => updateOrderStatus(order.id, 'producao')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'producao' ? 'bg-pink-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>2. Produção</button>
                        <button onClick={() => updateOrderStatus(order.id, 'entrega')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'entrega' ? 'bg-blue-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>3. Entrega</button>
                      </div>

                      <div className="w-full sm:w-auto">
                        <label className={`w-full sm:w-auto px-4 py-2 rounded-lg font-black text-xs cursor-pointer flex items-center justify-center gap-1 shadow transition-all ${order.status === 'finalizado' ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                          <span>{order.status === 'finalizado' ? 'Alterar Foto / Finalizado ✅' : '📸 Finalizar com Foto'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDeliveryPhotoUpload(order.id, e)} />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOVA ABA: CLIENTES (FIDELIDADE) */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Clube de Fidelidade & Clientes 👥</h2>
            {customers.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum cliente cadastrado ainda.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customers.map((cust, idx) => {
                  const ordersCount = cust.totalOrders || 0;
                  const targetOrders = 5; // Meta de 5 compras para ganhar desconto
                  const progress = Math.min((ordersCount / targetOrders) * 100, 100);

                  return (
                    <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-slate-900 text-lg">{cust.name}</h3>
                          <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-full">{ordersCount}ª compra</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">📞 {cust.phone}</p>
                        <p className="text-xs font-bold text-slate-700 mt-2">Total Gasto: R$ {(cust.totalSpent || 0).toFixed(2)}</p>
                      </div>

                      {/* BARRA DE PROGRESSO DA PROMOÇÃO */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span>Progresso para Desconto</span>
                          <span>{ordersCount} / {targetOrders} pedidos</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-pink-500 to-orange-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {ordersCount >= targetOrders ? '🎉 Cliente apto para resgatar o desconto da promoção!' : `Faltam ${targetOrders - ordersCount} pedido(s) para a recompensa.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}