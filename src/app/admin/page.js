"use client";

import React, { useState, useEffect } from "react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("sections"); // "sections", "toppings", "orders"

  const [sections, setSections] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
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
        },
        {
          id: "sec_monte",
          title: "Monte do Seu Jeito 🎨",
          layout: "vertical",
          items: [
            { id: "m240", name: "Açaí Tradicional - 240ml", description: "Com 3 acompanhamentos", price: 12.0, image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?auto=format&fit=crop&q=80&w=300", freeLimit: 3 },
            { id: "m300", name: "Açaí Tradicional - 300ml", description: "Com 4 acompanhamentos", price: 17.0, image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=300", freeLimit: 4 },
            { id: "m500", name: "Açaí Tradicional - 500ml", description: "Com 5 acompanhamentos", price: 20.0, image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300", freeLimit: 5 }
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

  const saveAllChanges = () => {
    localStorage.setItem("admin_sections", JSON.stringify(sections));
    localStorage.setItem("admin_toppings", JSON.stringify(toppings));
    alert("Alterações salvas com sucesso! A loja foi atualizada.");
  };

  // Gerenciamento de Seções
  const addNewSection = () => {
    const newSec = {
      id: Date.now().toString(),
      title: "Nova Seção 🌟",
      layout: "vertical",
      items: []
    };
    setSections([...sections, newSec]);
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

  // Gerenciamento de Produtos dentro de uma Seção
  const addItemToSection = (secId) => {
    const newItem = {
      id: Date.now().toString(),
      name: "Novo Produto",
      description: "Descrição do produto",
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

  // Gerenciamento de Adicionais
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

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black">Painel Administrativo 🛠️</h1>
          <p className="text-xs text-slate-400">Um Pedacinho de Felicidade</p>
        </div>
        <a href="/" target="_blank" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
          Ver a Loja 🛍️
        </a>
      </header>

      {/* ABAS */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab("sections")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'sections' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
            Seções & Produtos 📂
          </button>
          <button onClick={() => setActiveTab("toppings")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'toppings' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
            Adicionais 🍓
          </button>
          <button onClick={() => setActiveTab("orders")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
            Pedidos ({orders.length}) 📦
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* ABA 1: SEÇÕES E PRODUTOS */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <button onClick={addNewSection} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-all text-xs">
                + Adicionar Nova Seção / Categoria
              </button>
              <button onClick={saveAllChanges} className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2.5 rounded-xl shadow transition-all text-xs">
                Salvar Alterações 💾
              </button>
            </div>

            {sections.map((sec) => (
              <div key={sec.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex gap-2 items-center flex-wrap pb-3 border-b border-slate-100">
                  <input 
                    type="text" 
                    value={sec.title} 
                    onChange={(e) => updateSectionTitle(sec.id, e.target.value)} 
                    className="flex-1 p-2.5 border rounded-xl font-black text-base text-slate-800 bg-slate-50"
                    placeholder="Nome da Seção (ex: Bebidas)"
                  />
                  <select 
                    value={sec.layout} 
                    onChange={(e) => updateSectionLayout(sec.id, e.target.value)}
                    className="p-2.5 border rounded-xl font-bold text-xs bg-slate-50 text-slate-700"
                  >
                    <option value="vertical">Estilo Lista Vertical</option>
                    <option value="carousel">Estilo Carrossel (Destaque)</option>
                  </select>
                  <button onClick={() => removeSection(sec.id)} className="bg-red-100 text-red-600 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-red-200">
                    🗑️ Apagar Seção
                  </button>
                </div>

                {/* Produtos da Seção */}
                <div className="space-y-3 pl-2 sm:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Produtos ({sec.items.length})</span>
                    <button onClick={() => addItemToSection(sec.id)} className="bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-orange-200">
                      + Adicionar Produto
                    </button>
                  </div>

                  {sec.items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum produto nesta seção ainda.</p>
                  ) : (
                    sec.items.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => updateItemInSec(sec.id, item.id, 'name', e.target.value)} 
                          className="flex-1 p-2 border rounded-lg text-sm font-bold text-slate-800 bg-white" 
                          placeholder="Nome"
                        />
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updateItemInSec(sec.id, item.id, 'price', Number(e.target.value))} 
                          className="w-24 p-2 border rounded-lg text-sm font-bold text-orange-600 bg-white" 
                          placeholder="Preço"
                        />
                        <button onClick={() => removeItemFromSection(sec.id, item.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs hover:bg-red-200">
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 2: ADICIONAIS */}
        {activeTab === "toppings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800">Gerenciar Adicionais e Complementos</h2>
              <div className="flex gap-2">
                <button onClick={addTopping} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs">+ Novo Adicional</button>
                <button onClick={saveAllChanges} className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2.5 rounded-xl shadow text-xs">Salvar 💾</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              {toppings.map((t) => (
                <div key={t.id} className="flex gap-3 items-center border-b border-slate-100 pb-3">
                  <input type="text" value={t.name} onChange={(e) => updateTopping(t.id, 'name', e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold text-slate-800" placeholder="Nome" />
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-600 whitespace-nowrap">
                    <input type="checkbox" checked={t.premium} onChange={(e) => updateTopping(t.id, 'premium', e.target.checked)} className="w-4 h-4 rounded text-orange-500" />
                    Pago?
                  </label>
                  <input type="number" value={t.price} disabled={!t.premium} onChange={(e) => updateTopping(t.id, 'price', Number(e.target.value))} className="w-20 p-2 border rounded-lg text-sm font-bold text-orange-600 disabled:bg-slate-100" placeholder="Preço" />
                  <button onClick={() => removeTopping(t.id)} className="bg-red-100 text-red-600 p-2 rounded-lg font-bold text-xs hover:bg-red-200">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: PEDIDOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-800">Gerenciamento de Pedidos</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 font-bold border border-slate-200">Nenhum pedido recebido ainda.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col gap-4">
                    <div className={`absolute top-0 left-0 w-2 h-full ${order.status === 'aguardando' ? 'bg-orange-500' : order.status === 'producao' ? 'bg-pink-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <span className="font-black text-lg text-slate-900">Pedido #{order.id}</span>
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

                    <div className="pl-2 flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => updateOrderStatus(order.id, 'aguardando')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'aguardando' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>1. Aguardando</button>
                      <button onClick={() => updateOrderStatus(order.id, 'producao')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'producao' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}>2. Em Produção</button>
                      <button onClick={() => updateOrderStatus(order.id, 'entrega')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${order.status === 'entrega' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>3. Entregar</button>
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