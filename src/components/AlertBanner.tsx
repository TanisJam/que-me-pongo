import React from 'react';

interface AlertBannerProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onDismiss, onRetry }) => {
  const bgColor = {
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
    success: 'bg-green-100 border-green-400 text-green-700'
  }[type];

  return (
    <div className={`p-4 mb-4 flex items-start justify-between rounded border ${bgColor}`} role="alert">
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-2 px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
          >
            Reintentar
          </button>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="ml-4 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AlertBanner; 