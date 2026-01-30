import React from 'react';

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: '8px'
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.2s'
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px'
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical' as const,
  fontFamily: 'inherit'
};

export const buttonPrimaryStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)'
};

export const buttonSecondaryStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'white',
  color: '#FF8C42',
  border: '2px solid #FF8C42',
  borderRadius: '30px',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

export const containerStyle: React.CSSProperties = {
  background: 'white',
  padding: '32px',
  borderRadius: '24px',
  border: '2px solid #FFE5B4',
  boxShadow: '0 8px 24px rgba(255, 140, 66, 0.15)'
};

export const headerGradientStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%)',
  padding: '32px',
  borderRadius: '16px',
  marginBottom: '32px',
  color: 'white',
  boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
  position: 'relative',
  overflow: 'hidden'
};
