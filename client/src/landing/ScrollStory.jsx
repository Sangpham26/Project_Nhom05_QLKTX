import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { storyScenes } from '../landingAssets';
import Photo from './Photo';
import { clamp, observeScroll, useMediaQuery } from './useLandingMotion';

export default function ScrollStory() {
  const section = useRef(null);
  const articles = useRef([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const enhanced = useMediaQuery('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
  useEffect(() => {
    if (!enhanced) return;
    const root = section.current;
    const cleanup = observeScroll(() => {
      const focusLine = window.innerHeight * 0.53;
      let next = 0;
      articles.current.forEach((article, index) => {
        if (article && article.getBoundingClientRect().top <= focusLine) next = index;
      });
      if (activeRef.current !== next) { activeRef.current = next; setActive(next); }
      const current = articles.current[next];
      if (current) {
        const progress = clamp((focusLine - current.getBoundingClientRect().top) / current.offsetHeight);
        root.style.setProperty('--dl-story-drift', `${(progress - 0.5) * -18}px`);
        root.style.setProperty('--dl-step-progress', progress);
      }
    });
    return () => { cleanup(); root.style.removeProperty('--dl-story-drift'); root.style.removeProperty('--dl-step-progress'); };
  }, [enhanced]);
  return <section id="khong-gian" ref={section} className={`dl-story dl-container${enhanced ? ' is-enhanced' : ''}`} aria-labelledby="dl-story-heading">
    <div className="dl-section-head" data-dl-reveal><span className="dl-kicker">02 / KHÁM PHÁ KHÔNG GIAN</span><h2 id="dl-story-heading">Xem không gian.<br /><em>Trước khi chọn phòng.</em></h2><p>Xem hình ảnh khu nhà, nội thất phòng ở và khu vực chung.</p></div>
    <div className="dl-story-layout">
      <div className="dl-story-sticky" aria-label="Ảnh theo từng bước khám phá">
        <div className="dl-story-stack">{storyScenes.map((scene, index) => <div key={scene.photo.src} className={`dl-story-frame${active === index ? ' is-active' : ''}`} aria-hidden={active !== index}><Photo key={scene.photo.src} {...scene.photo} /></div>)}</div>
        <div className="dl-story-photo-meta"><span>{storyScenes[active].photo.caption}</span><span className="dl-step-number">0{active + 1}<i />03</span></div>
        <div className="dl-story-meter" aria-hidden="true"><span style={{ '--dl-step': active }} /></div>
      </div>
      <div className="dl-story-narrative">{storyScenes.map((scene, index) => <article ref={(element) => { articles.current[index] = element; }} key={scene.title} className={`dl-story-step${active === index ? ' is-current' : ''}`}>
        <figure className="dl-story-inline"><Photo key={scene.photo.src} {...scene.photo} /><figcaption>{scene.photo.caption} · ảnh giới thiệu</figcaption></figure>
        <div className="dl-story-step-copy"><span className="dl-kicker"><b>0{index + 1}</b> {scene.eyebrow}</span><h3>{scene.title}</h3><p>{scene.body}</p>{scene.href && <a className="dl-text-link" href={scene.href}>{scene.link}<ArrowUpRight size={19} /></a>}</div>
      </article>)}</div>
    </div>
  </section>;
}
