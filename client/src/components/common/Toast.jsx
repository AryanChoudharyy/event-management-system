import { useState, useCallback } from 'react';

const toasts = [];
let listeners = [];

const notify = () => listeners.forEach((fn) => fn([...toasts]));

export const addToast = (message, type = 'success') => {
  const id = Date.now();
  toasts.push({ id, message, type });
  notify();
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.splice(idx, 1);
      notify();
    }
  }, 3500);
};

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  // Subscribe to toast updates
  useState(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((fn) => fn !== setItems);
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="toast-container">
      {items.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
