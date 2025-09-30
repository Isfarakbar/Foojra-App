import React, { useState, useEffect } from 'react';
import { createApiUrlWithFallback } from '../utils/api';
import { mockShops } from '../data/mockShops';

const HomeScreen = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = createApiUrlWithFallback('api/shops/approved');
        
        // If API URL is null (fallback mode), use mock data
        if (!apiUrl) {
          console.log('🔄 Using mock data fallback');
          setShops(mockShops);
          setLoading(false);
          return;
        }
        
        console.log('🔗 Fetching from API:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setShops(data.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('❌ API Error:', error);
        console.log('🔄 Falling back to mock data');
        setShops(mockShops);
        setError('Using demo data - API temporarily unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);



  if (loading) {
    return (
      <div className="home-screen">
        <div className="container">
          <h2>Available Shops</h2>
          <div className="loading">Loading shops...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <div className="container">
        <div className="search-filters">
          <div className="search-bar">
            <input type="text" placeholder="Search shops by name..." />
          </div>
          <div className="filters">
            <select>
              <option>All Categories</option>
            </select>
            <select>
              <option>All Cuisines</option>
            </select>
            <select>
              <option>All Areas in Gojra</option>
            </select>
            <button className="clear-btn">✕ Clear</button>
          </div>
        </div>

        <h2>Available Shops</h2>
        
        {error && (
          <div className="error-notice" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            color: '#856404',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            ℹ️ {error}
          </div>
        )}

        <div className="shops-grid">
          {shops.length > 0 ? (
            shops.map((shop) => (
              <div key={shop._id} className="shop-card">
                <img src={shop.image} alt={shop.name} />
                <div className="shop-info">
                  <h3>{shop.name}</h3>
                  <p className="description">{shop.description}</p>
                  <div className="shop-details">
                    <span className="cuisine">{shop.cuisine}</span>
                    <span className="rating">⭐ {shop.rating}</span>
                  </div>
                  <div className="delivery-info">
                    <span>{shop.deliveryTime}</span>
                    <span>Min: ${shop.minimumOrder}</span>
                    <span>Fee: ${shop.deliveryFee}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-shops">No approved shops available</div>
          )}
        </div>

        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-icon">🚚</div>
              <h3>Order</h3>
              <p>Browse and order from your favorite restaurants</p>
            </div>
            <div className="step">
              <div className="step-icon">🍳</div>
              <h3>Prepare</h3>
              <p>Restaurant prepares your fresh meal</p>
            </div>
            <div className="step">
              <div className="step-icon">🚀</div>
              <h3>Deliver</h3>
              <p>Fast delivery right to your doorstep</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;