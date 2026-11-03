import { createContext, useCallback, useContext, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((variant, message) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showToast = useCallback(
    (message, variant = 'success') => push(variant, message),
    [push]
  );

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} onClose={() => dismiss(t.id)} autohide delay={4000}>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
