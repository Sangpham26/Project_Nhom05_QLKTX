import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function Photo({ src, alt, width = 1200, height = 800, eager = false, className = '' }) {
  const [state, setState] = useState('loading');
  // Callers key changing sources so every photo has its own loading/error state.
  return <div className={`dl-photo ${className}${state === 'loaded' ? ' is-loaded' : ''}`}>
    {state !== 'error' && <img src={src} alt={alt} width={width} height={height}
      loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined}
      decoding="async" onLoad={() => setState('loaded')} onError={() => setState('error')} />}
    {state === 'loading' && <span className="dl-photo-loading" role="status"><span />Đang tải ảnh</span>}
    {state === 'error' && <div className="dl-photo-error" role="status"><ImageOff size={30} strokeWidth={1.3} /><strong>Chưa tải được ảnh</strong><p>Bạn có thể chọn góc nhìn khác hoặc tải lại trang.</p></div>}
  </div>;
}
