"use client";

import React, { useState, useEffect } from "react";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState("sections"); // "sections", "toppings", "orders"

  const [sections, setSections] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const isLogged = sessionStorage.getItem("admin_logged");
    if (isLogged === "true") setIsAuthenticated(true);

    if (localStorage.getItem("admin_sections")) {
      setSections(JSON.parse(localStorage.getItem("admin_sections")));
    } else {
      setSections([
        {
          id: "sec_queridinhos",
          title: "Os Queridinhos 😍",
          layout: "carousel",
          items: [
            { id: "p1", name: "Explosão de Alegria", description: "Açaí, Leite Ninho, Morango fresco e Leite Condensado", price: 22.0, image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=600", freeLimit: 3 },
            { id: "p2", name: "Especial Luiza", description: "Açaí, Nutella na borda, pedaços de Brownie e Morango", price: 28.0, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=600", freeLimit: 3 },
            { id: "p3", name: "Taça Céu Azul", description: "Açaí, Creme de Cupuaçu, Banana, Kiwi e Granola", price: 24.0, image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600", freeLimit: 3 }
          ]
        }
      ]);
    }

    if (localStorage.getItem("admin_toppings")) {
      setToppings(JSON.parse(localStorage.getItem("admin_toppings")));
    } else {
      setToppings([
        { id: "t1", name: "Leite Ninho", price: 0, premium: false },
        { id: "t2", name: "Granola Crocante", price: 0, premium: false },
        { id: "t3", name: "Morango", price: 0, premium: false },
        { id: "t4", name: "Banana", price: 0, premium: false },
        { id: "t5", name: "Paçoca", price: 0, premium: false },
        { id: "t6", name: "Leite Condensado", price: 0, premium: false },
        { id: "t7", name: "Nutella Extra", price: 4.0, premium: true },
        { id: "t8", name: "Ouro Branco", price: 3.0, premium: true },
      ]);
    }

    if (localStorage.getItem("pedacinho_orders")) {
      setOrders(JSON.parse(localStorage.getItem("pedacinho_orders")));
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput === "pedacinho da felicidade admin" && passwordInput === "pedacinho admin 1 2 3") {
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

  const saveAllChanges = () => {
    localStorage.setItem("admin_sections", JSON.stringify(sections));
    localStorage.setItem("admin_toppings", JSON.stringify(toppings));
    alert("Alterações salvas com sucesso! A loja foi atualizada.");
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
    const newItem = { id: Date.now().toString(), name: "Novo Produto", description: "Descrição", price: 15.0, image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=300", freeLimit: 3 };
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

  const addTopping = () => {
    setToppings([...toppings, { id: Date.now().toString(), name: "Novo Adicional", price: 0, premium: false }]);
  };

  const removeTopping = (id) => {
    setToppings(toppings.filter(t => t.id !== id));
  };

  const updateTopping = (id, field, value) => {
    setToppings(toppings.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem("pedacinho_orders", JSON.stringify(updated));
  };

  const handleDeliveryPhotoUpload = (orderId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      const updated = orders.map(o => o.id === orderId ? { ...o, deliveryPhoto: base64Image, status: 'finalizado' } : o);
      setOrders(updated);
      localStorage.setItem("pedacinho_orders", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
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
            <button type="submit" className="w-full bg-[#FFD100] text-yellow-900 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform text-base mt-2">
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
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black">Painel Administrativo 🛠️</h1>
          <p className="text-xs text-slate-400">Um Pedacinho de Felicidade</p>
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
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* SEÇÕES */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button onClick={addNewSection} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Nova Seção</button>
              <button onClick={saveAllChanges} className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar Alterações 💾</button>
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
                    <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <input type="text" value={item.name} onChange={(e) => updateItemInSec(sec.id, item.id, 'name', e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold bg-white" placeholder="Nome" />
                      <input type="number" value={item.price} onChange={(e) => updateItemInSec(sec.id, item.id, 'price', Number(e.target.value))} className="w-24 p-2 border rounded-lg text-sm font-bold text-orange-600 bg-white" placeholder="Preço" />
                      <button onClick={() => removeItemFromSection(sec.id, item.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs">🗑️</button>
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
                <button onClick={saveAllChanges} className="bg-green-600 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar 💾</button>
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

        {/* PEDIDOS COM BARRA DE PROGRESSÃO E FOTO DA CASA */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Gerenciamento de Pedidos em Tempo Real</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum pedido recebido ainda.</div>
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

                    <div className="pl-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                      <p className="font-bold text-slate-800">Cliente: {order.customer || "Não informado"}</p>
                      <p className="text-slate-600">Endereço: {order.address || "Não informado"}</p>
                      <div className="mt-2 pt-2 border-t border-slate-200 font-medium text-xs text-slate-700">
                        {order.items.map((i, idx) => (
                          <div key={idx}>• {i.item.name} {i.toppings.length > 0 ? `(${i.toppings.map(t=>t.name).join(', ')})` : ''}</div>
                        ))}
                      </div>
                    </div>

                    {/* Exibir foto da entrega se houver */}
                    {order.deliveryPhoto && (
                      <div className="pl-2">
                        <p className="text-xs font-bold text-slate-500 mb-1">📸 Foto de comprovação enviada pelo motoboy:</p>
                        <img src={order.deliveryPhoto} alt="Comprovação" className="w-32 h-24 object-cover rounded-xl border shadow-sm" />
                      </div>
                    )}

                    {/* BOTÕES DE PROGRESSÃO */}
                    <div className="pl-2 flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 items-center">
                      <div className="flex gap-1 flex-1 w-full">
                        <button onClick={() => updateOrderStatus(order.id, 'aguardando')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'aguardando' ? 'bg-orange-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>1. Aguardando</button>
                        <button onClick={() => updateOrderStatus(order.id, 'producao')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'producao' ? 'bg-pink-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>2. Produção</button>
                        <button onClick={() => updateOrderStatus(order.id, 'entrega')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'entrega' ? 'bg-blue-500 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>3. Entrega</button>
                      </div>

                      {/* BOTÃO FINALIZAR COM UPLOAD DE FOTO DA CASA */}
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
      </main>
    </div>
  );
}