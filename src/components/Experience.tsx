'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';
import LiquidSignal from './LiquidSignal';

type Motion = { x:number; y:number; vx:number; vy:number; px:number; py:number; down:boolean; ready:boolean; reduced:boolean };
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <div className="fallback"><strong>WEBECK</strong><p>3Dを表示できませんでした。WebGLが使えるブラウザーで再読み込みしてください。</p></div> : this.props.children;}
}

function Sculpture({motion}:{motion:React.RefObject<Motion>}) {
  const group=useRef<THREE.Group>(null!);
  const material=useRef<THREE.MeshPhysicalMaterial>(null!);
  const particles=useRef<THREE.Points>(null!);
  const particleMaterial=useRef<THREE.PointsMaterial>(null!);
  const halo=useRef<THREE.MeshBasicMaterial>(null!);
  const energy=useRef(0);
  const color=useRef(new THREE.Color());
  const positions=useState(()=>{
    const a=new Float32Array(360*3);
    for(let i=0;i<360;i++){
      const theta=i*2.399963, z=1-2*(i+.5)/360, r=2.1+(Math.sin(i*73.13)*.5+.5)*2.4;
      a[i*3]=Math.cos(theta)*Math.sqrt(1-z*z)*r;a[i*3+1]=Math.sin(theta)*Math.sqrt(1-z*z)*r;a[i*3+2]=z*r;
    }return a;
  })[0];
  useFrame(({clock,camera},delta)=>{
    const dt=Math.min(delta,.05), m=motion.current, t=clock.elapsedTime;
    if(!m.ready)return;
    if(!m.down){m.x+=m.vx*dt;m.y+=m.vy*dt;m.vx*=Math.exp(-1.5*dt);m.vy*=Math.exp(-1.5*dt);}
    const target=Math.min(Math.hypot(m.vx,m.vy)/14,1)*(m.reduced?.22:1);
    energy.current=THREE.MathUtils.damp(energy.current,target,5,dt);
    const e=energy.current;
    group.current.rotation.set(m.x+m.py*.08,m.y+m.px*.1+(m.reduced?0:t*.11),.18);
    group.current.position.y=m.reduced?0:Math.sin(t*.85)*.1;
    const s=THREE.MathUtils.damp(group.current.scale.x,m.down?.94:1+e*.06,9,dt);
    group.current.scale.setScalar(s);
    color.current.setHSL(.54+e*.34,.85,.57);
    material.current.color.copy(color.current);
    material.current.emissive.copy(color.current);
    material.current.emissiveIntensity=.06+e*.95;
    material.current.roughness=.19-e*.07;
    particleMaterial.current.color.copy(color.current);
    particleMaterial.current.opacity=Math.max(0,e-.18)*.85;
    particleMaterial.current.size=.018+e*.025;
    particles.current.rotation.y+=dt*e*.3;
    particles.current.rotation.z+=dt*e*.15;
    particles.current.scale.setScalar(1+e*.22);
    halo.current.color.copy(color.current);halo.current.opacity=.015+Math.max(0,e-.45)*.16;
    const aspect=camera instanceof THREE.PerspectiveCamera?camera.aspect:1;
    camera.position.z=THREE.MathUtils.damp(camera.position.z,6.8*Math.max(1,.85/aspect)+e*.3,3,dt);
  });
  return <>
    <ambientLight intensity={.3}/><pointLight position={[3,3,4]} intensity={28} color="#a5efff"/><pointLight position={[-4,-1,2]} intensity={18} color="#8462ff"/>
    <Environment resolution={128}>
      <Lightformer form="rect" intensity={5} position={[0,4,-3]} scale={[8,2,1]} rotation={[Math.PI/2,0,0]}/>
      <Lightformer form="rect" intensity={4} position={[-4,0,2]} scale={[2,8,1]} rotation={[0,Math.PI/2,0]}/>
      <Lightformer form="ring" intensity={3} color="#80ccff" position={[3,1,4]} scale={5}/>
    </Environment>
    <group ref={group}>
      <mesh><torusKnotGeometry args={[1.13,.34,192,32,2,3]}/><meshPhysicalMaterial ref={material} color="#67dfff" metalness={.82} roughness={.19} clearcoat={1} clearcoatRoughness={.12} emissive="#67dfff" emissiveIntensity={.06}/></mesh>
    </group>
    <points ref={particles}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial ref={particleMaterial} transparent opacity={0} size={.03} depthWrite={false} blending={THREE.AdditiveBlending}/></points>
    <mesh position={[0,0,-3]}><circleGeometry args={[5,96]}/><meshBasicMaterial ref={halo} color="#67dfff" transparent opacity={.015} depthWrite={false}/></mesh>
  </>;
}

export default function Experience(){
  const root=useRef<HTMLElement>(null), stage=useRef<HTMLDivElement>(null), word=useRef<HTMLSpanElement>(null);
  const motion=useRef<Motion>({x:.35,y:.2,vx:0,vy:0,px:0,py:0,down:false,ready:false,reduced:false});
  const pointer=useRef({id:-1,x:0,y:0,time:0});
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{motion.current.reduced=media.matches;};update();media.addEventListener('change',update);
    const reset=()=>{motion.current.down=false;motion.current.vx=0;motion.current.vy=0;pointer.current.id=-1;};
    window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    const ctx=gsap.context(()=>{
      gsap.timeline().to(word.current,{opacity:1,duration:1.25,ease:'sine.inOut'},.15).to(word.current,{opacity:0,duration:1,ease:'sine.inOut'},1.9).call(()=>{motion.current.ready=true;}).to(stage.current,{opacity:1,duration:1.25,ease:'sine.inOut'},3);
    },root);
    return ()=>{ctx.revert();media.removeEventListener('change',update);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);motion.current.ready=false;};
  },[]);
  return <main ref={root} aria-label="WEBECK">
    <div className="intro" aria-hidden="true"><span ref={word}>WEBECK</span></div>
    <LiquidSignal />
    <div ref={stage} className="stage" tabIndex={0} role="application" aria-label="回転する3Dオブジェクト。ドラッグ、スワイプ、または矢印キーで回転。スペースキーで停止。"
      onPointerDown={e=>{if(!motion.current.ready||pointer.current.id!==-1||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp};motion.current.down=true;motion.current.vx=0;motion.current.vy=0;}}
      onPointerMove={e=>{const m=motion.current;const rect=e.currentTarget.getBoundingClientRect();m.px=(e.clientX/rect.width-.5)*2;m.py=(e.clientY/rect.height-.5)*2;if(pointer.current.id!==e.pointerId||!m.down)return;const p=pointer.current,dt=Math.max((e.timeStamp-p.time)/1000,.008),factor=5/Math.min(rect.width,rect.height);const dx=(e.clientX-p.x)*factor,dy=(e.clientY-p.y)*factor;m.x+=dy;m.y+=dx;m.vx=THREE.MathUtils.clamp(dy/dt,-20,20);m.vy=THREE.MathUtils.clamp(dx/dt,-20,20);pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp};}}
      onPointerUp={e=>{if(pointer.current.id!==e.pointerId)return;if(e.timeStamp-pointer.current.time>90){motion.current.vx=0;motion.current.vy=0;}motion.current.down=false;pointer.current.id=-1;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
      onPointerCancel={()=>{motion.current.down=false;motion.current.vx=0;motion.current.vy=0;pointer.current.id=-1;}}
      onLostPointerCapture={()=>{motion.current.down=false;pointer.current.id=-1;}}
      onKeyDown={e=>{if(!motion.current.ready)return;const m=motion.current;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowUp')m.vx=Math.max(-20,m.vx-4);if(e.key==='ArrowDown')m.vx=Math.min(20,m.vx+4);if(e.key==='ArrowLeft')m.vy=Math.max(-20,m.vy-4);if(e.key==='ArrowRight')m.vy=Math.min(20,m.vy+4);if(e.key===' '){m.vx=0;m.vy=0;}}}>
      <SceneBoundary><Canvas camera={{position:[0,0,6.8],fov:45}} dpr={[1,1.75]} gl={{antialias:true,alpha:true}} fallback={<div className="fallback"><strong>WEBECK</strong><p>WebGL対応のブラウザーで開いてください。</p></div>}><Sculpture motion={motion}/></Canvas></SceneBoundary>
    </div><div className="vignette"/>
  </main>;
}
