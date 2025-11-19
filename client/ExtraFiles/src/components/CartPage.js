import React from 'react';
import './CartPage.css';

const CartPage = ({ cartItems, onRemoveFromCart, onContinueShopping }) => {
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart to continue shopping.</p>
          <button className="continue-shopping-btn" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button className="continue-shopping-btn" onClick={onContinueShopping}>
          ← Continue Shopping
        </button>
      </div>
      
      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="cart-item">
              <div className="cart-item-image">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                  />
                ) : (
                  <div className="cart-item-image-missing">
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-description">{item.description}</p>
                <div className="cart-item-footer">
                  <span className="cart-item-price">${item.price}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => onRemoveFromCart(item)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
            <span>${calculateTotal()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${calculateTotal()}</span>
          </div>
          <button className="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;