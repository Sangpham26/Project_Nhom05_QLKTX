import React, { useEffect, useMemo, useState } from 'react';
import { BedDouble, Building2, ImageOff, RefreshCw, Users } from 'lucide-react';
import { api, labels, money } from './api';

export function coverOf(type) {
  const images = [...(type?.images || [])].sort((a,b) => a.order - b.order);
  return images.find(x => x.isCover) || images[0] || null;
}

function Placeholder({failed, onRetry}) {
  return <div className="gallery-placeholder"><div className="gallery-placeholder-art"><BedDouble size={55} strokeWidth={1.5}/><span/><span/></div><strong>{failed ? 'Không thể tải ảnh này' : 'Không gian đang chờ hình ảnh'}</strong><p>{failed ? 'Bạn có thể thử tải lại hoặc chọn ảnh khác bên dưới.' : 'Ảnh của loại phòng sẽ hiển thị tại đây khi được thêm.'}</p>{failed && <button type="button" className="button button-outline" onClick={onRetry}><RefreshCw size={15}/>Thử lại</button>}</div>;
}

export default function RoomGallery({ type, room, rooms = [], children }) {
  const [images,setImages] = useState([...(type?.images || [])].sort((a,b)=>a.order-b.order));
  const [activeId,setActiveId] = useState(coverOf(type)?.id || null);
  const [loading,setLoading] = useState(Boolean(coverOf(type)));
  const [broken,setBroken] = useState(false);
  const [retry,setRetry] = useState(0);
  const [loadError,setLoadError] = useState('');
  const [failedThumbs,setFailedThumbs] = useState(new Set());
  useEffect(()=>{
    let alive = true;
    setImages([...(type?.images || [])].sort((a,b)=>a.order-b.order));
    setActiveId(coverOf(type)?.id || null);
    setLoadError('');
    api(`/roomTypes/${type.id}/images`).then(items=>{
      if(!alive)return;
      const sorted=[...items].sort((a,b)=>a.order-b.order);
      setImages(sorted);
      setActiveId((sorted.find(x=>x.isCover)||sorted[0])?.id||null);
    }).catch(error=>{if(alive)setLoadError(error.message);});
    return()=>{alive=false;};
  },[type.id]);
  const active = images.find(x=>x.id===activeId) || images[0];
  useEffect(()=>{setLoading(Boolean(active));setBroken(false);},[active?.id,retry]);
  const typeRooms=useMemo(()=>rooms.filter(x=>x.roomTypeId===type.id && x.status==='ACTIVE'),[rooms,type.id]);
  const vacancy=room ? room.vacant : typeRooms.reduce((sum,x)=>sum+x.vacant,0);
  const capacity=room ? room.operationalCapacity : type.defaultCapacity;
  const select=image=>{setActiveId(image.id);setRetry(0);};
  const tryAgain=()=>{setBroken(false);setLoading(true);setRetry(x=>x+1);};
  return <div className="room-gallery-layout">
    <div className="room-gallery-media">
      <div className="gallery-main">
        {active && !broken && <img key={`${active.id}-${retry}`} src={`${active.url}${retry?`?retry=${retry}`:''}`} alt={active.description || type.name} onLoad={()=>setLoading(false)} onError={()=>{setLoading(false);setBroken(true);}}/>}
        {active && loading && !broken && <div className="gallery-loading"><span className="spinner"/>Đang tải ảnh...</div>}
        {(!active || broken) && <Placeholder failed={broken} onRetry={tryAgain}/>}
      </div>
      {images.length>1 && <div className="gallery-thumbnails" aria-label="Ảnh thu nhỏ loại phòng">{images.map((image,index)=><button type="button" key={image.id} aria-label={`Xem ảnh ${index+1}${image.description?`: ${image.description}`:''}`} aria-pressed={image.id===active?.id} className={`gallery-thumb ${image.id===active?.id?'selected':''}`} onClick={()=>select(image)}>{failedThumbs.has(image.id)?<ImageOff size={22}/>:<img src={image.url} alt={image.description || `Ảnh thu nhỏ ${index+1}`} loading="lazy" onError={()=>setFailedThumbs(old=>new Set(old).add(image.id))}/>}<span>{String(index+1).padStart(2,'0')}</span></button>)}</div>}
      <p className="gallery-caption">{active?.description && !broken ? active.description : "\u00a0"}</p>
      {loadError && <p className="gallery-warning">Không cập nhật được thư viện ảnh: {loadError}</p>}
    </div>
    <div className="room-gallery-info">
      <span className="eyebrow">{room ? `PHÒNG ${room.code} · ${room.building?.name || 'KÝ TÚC XÁ'}` : 'KHÁM PHÁ LOẠI PHÒNG'}</span>
      <h2>{type.name}</h2>
      <p className="room-gallery-description">{type.description || 'Không gian sống tiện nghi dành cho sinh viên.'}</p>
      <div className="gallery-info-grid">
        <div><span><Users size={17}/>Sức chứa</span><strong>{capacity} người{room ? ` · đang ở ${room.occupied}` : '/ phòng'}</strong></div>
        <div><span><BedDouble size={17}/>Giới tính</span><strong>{labels[type.gender] || 'Tất cả'}</strong></div>
        {room && <div><span><Building2 size={17}/>Vị trí</span><strong>{room.building?.name} · Tầng {room.floor}</strong></div>}
        <div><span><BedDouble size={17}/>Còn trống</span><strong>{vacancy} chỗ{room ? '' : ` / ${typeRooms.length} phòng`}</strong></div>
      </div>
      <div className="gallery-price"><span>Phí tham khảo / sinh viên / tháng</span><strong>{money(type.fee)}</strong></div>
      {children && <div className="gallery-actions">{children}</div>}
    </div>
  </div>;
}
