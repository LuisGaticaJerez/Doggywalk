import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: '#4CAF50', icon: '✓' };
      case 'error':
        return { bg: '#f44336', icon: '✕' };
      case 'warning':
        return { bg: '#FFA500', icon: '⚠' };
      default:
        return { bg: '#2196F3', icon: 'ℹ' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '400px'
        }}
      >
        {toasts.map((toast) => {
          const colors = getToastColors(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                background: colors.bg,
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideIn 0.3s ease',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              <span style={{ fontSize: '20px' }}>{colors.icon}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </ToastContext.Provider>
  );
};
