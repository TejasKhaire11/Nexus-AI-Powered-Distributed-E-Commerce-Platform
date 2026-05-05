import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Sparkles, User, LogOut, Package, CheckCircle2, History, Cpu, X, Plus, Minus, CreditCard } from 'lucide-react';
import './index.css';

// Stunning fallback images from Unsplash
const fallbackImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", // Headphones
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", // Watch
  "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80", // PS5
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80", // Camera
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80", // Earbuds
];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  
  // Shopping Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [trainingAI, setTrainingAI] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchRecommendations();
    }
  }, [token, userId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/v1/auth/login', { username, password });
      const jwt = res.data.token;
      setToken(jwt);
      localStorage.setItem('token', jwt);
      
      const demoUserId = '1'; 
      setUserId(demoUserId);
      localStorage.setItem('userId', demoUserId);
    } catch (err) {
      setError('Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken('');
    setUserId('');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setRecommendations([]);
    setProducts([]);
    setOrderHistory([]);
    setCart([]);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/v1/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.content || res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchRecommendations = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`/recommendations/${userId}`);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
  };

  // Cart Functions
  const addToCart = (product) => {
    if (!product || !product.id) {
      alert("Invalid product data");
      return;
    }
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const checkout = async () => {
    setLoading(true);
    setIsCartOpen(false);
    
    try {
      // Fire backend call for each item in the cart
      const orderPromises = cart.map(item => 
        axios.post('/api/v1/orders', {
          userId: parseInt(userId),
          productId: item.id,
          quantity: item.quantity
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(orderPromises);
      
      // Update local history
      const newOrders = cart.map(item => ({
        ...item,
        orderDate: new Date().toLocaleTimeString(),
        status: 'PENDING'
      }));
      setOrderHistory([...newOrders, ...orderHistory]);
      
      // Clear Cart
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
      
      // Trigger AI Training
      setTrainingAI(true);
      setTimeout(async () => {
        await fetchRecommendations();
        setTrainingAI(false);
      }, 3000);
      
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed. Ensure the products exist in the DB.");
    }
    setLoading(false);
  };

  const getImageUrl = (product) => {
    if (product.imageUrl) return product.imageUrl;
    // Hash the ID to pick a consistent fallback image
    const index = (product.id || 0) % fallbackImages.length;
    return fallbackImages[index];
  };

  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="glass-panel login-panel animate-fade-in">
          <div className="brand-logo">
            <Sparkles size={32} color="var(--primary)" />
          </div>
          <h1>Nexus Store Admin</h1>
          <p>Access the AI Recommendation Engine</p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Cpu className="pulse-icon" size={20} /> : <User size={20} />}
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      <header className="nav-header">
        <div className="brand">
          <Sparkles size={28} color="var(--ai-color)" />
          <div>
            <h1 style={{ marginBottom: 0, fontSize: '1.8rem' }}>Nexus Store</h1>
            <p style={{ fontSize: '0.85rem' }}>Powered by Kafka Event Streaming</p>
          </div>
        </div>
        <div className="nav-actions">
          <button className="cart-toggle" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="cart-badge">{cart.reduce((a,c) => a + c.quantity, 0)}</span>}
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Slide-out Cart Overlay */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
      <div className={`cart-drawer glass-panel ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}><X size={24} /></button>
        </div>
        
        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={48} opacity={0.2} />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={getImageUrl(item)} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <span className="price-tag">${Number(item.price || 0).toFixed(2)}</span>
                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14}/></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14}/></button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}><X size={18}/></button>
              </div>
            ))}
          </div>
        )}
        
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span className="price-tag">${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn-checkout" onClick={checkout} disabled={loading}>
              <CreditCard size={20} />
              {loading ? 'Processing...' : 'Checkout & Train AI'}
            </button>
          </div>
        )}
      </div>

      {orderSuccess && (
        <div className="glass-panel animate-slide-in notification-banner">
          <div className="icon-wrapper bg-success">
            <CheckCircle2 color="white" size={24} />
          </div>
          <div>
            <h3 style={{ color: 'var(--success)', margin: 0 }}>Kafka Events Dispatched</h3>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>Inventory service processing bulk order in background.</p>
          </div>
        </div>
      )}

      <div className="main-grid">
        <div className="left-column">
          
          {/* Products Gallery */}
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h2 className="section-title"><Package size={22} /> Trending Products</h2>
            <div className="grid-2">
              {products.length === 0 ? <p className="empty-state">No products in DB.</p> : products.map(product => (
                <div key={product.id} className="glass-card product-card">
                  <div className="product-image-wrapper">
                    <img src={getImageUrl(product)} alt={product.name} className="product-image" />
                    <span className="badge category-badge">{product.category}</span>
                  </div>
                  <div className="product-content">
                    <h3>{product.name}</h3>
                    <p className="product-desc">{product.description || 'Premium e-commerce product.'}</p>
                    <div className="flex-between" style={{ marginTop: '1rem' }}>
                      <span className="price-tag">${Number(product.price || 0).toFixed(2)}</span>
                      <button onClick={() => addToCart(product)} disabled={loading || trainingAI} className="buy-btn">
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order History */}
          <div className="glass-panel">
            <h2 className="section-title"><History size={22} /> Order History</h2>
            {orderHistory.length === 0 ? (
              <p className="empty-state">No past orders. AI model needs data!</p>
            ) : (
              <div className="history-list">
                {orderHistory.map((order, idx) => (
                  <div key={idx} className="history-item animate-slide-in">
                    <img src={getImageUrl(order)} alt={order.name} className="history-img-small" />
                    <div className="history-details">
                      <h4 style={{ margin: 0 }}>{order.name} <span style={{ opacity: 0.5 }}>x{order.quantity}</span></h4>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>Ordered at {order.orderDate}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="price-tag" style={{ fontSize: '1rem' }}>${(order.price * order.quantity).toFixed(2)}</span>
                      <div className="badge-status">{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* AI Recommendations */}
        <div className="right-column">
          <div className="glass-panel ai-panel">
            <h2 className="section-title ai-title">
              <Sparkles size={22} /> AI For You
            </h2>
            <p className="ai-subtitle">Scikit-Learn Collaborative Filtering Matrix</p>
            
            {trainingAI ? (
              <div className="training-container animate-fade-in">
                <div className="spinner">
                  <Cpu size={40} className="pulse-icon" />
                </div>
                <h3 className="training-text">Ingesting Kafka Events...</h3>
                <p>Re-calculating user similarities</p>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            ) : (
              <div className="recommendations-list">
                {recommendations.length === 0 ? (
                  <div className="empty-state ai-empty">
                    <Cpu size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3>Model Untrained</h3>
                    <p>Add products to your cart and checkout to feed data to the AI model.</p>
                  </div>
                ) : recommendations.map((rec, idx) => {
                  const fullProduct = products.find(p => p.id === parseInt(rec.product_id) || p.id === rec.product_id) || { name: 'Product ' + rec.product_id, price: 0 };
                  
                  return (
                    <div key={idx} className="glass-card ai-card animate-fade-in" style={{ animationDelay: `${idx * 0.15}s` }}>
                      <div className="ai-image-col">
                        <img src={getImageUrl(fullProduct)} alt={fullProduct.name} className="ai-product-img" />
                        <div className="ai-score-badge">
                          {(rec.score * 100).toFixed(0)}% Match
                        </div>
                      </div>
                      <div className="ai-card-content">
                        <h4 className="truncate">{fullProduct.name}</h4>
                        <p className="ai-reason">Algorithm: {rec.reason}</p>
                        <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                          <span className="price-tag" style={{ fontSize: '1.1rem' }}>${fullProduct.price?.toFixed(2) || '0.00'}</span>
                          <button 
                            onClick={() => addToCart(fullProduct)} 
                            className="buy-btn-small" 
                            disabled={loading || !fullProduct.id}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
