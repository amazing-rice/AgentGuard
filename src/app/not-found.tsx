import Link from "next/link";

export default function NotFound() {
  return <main style={{minHeight:"78vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 20px",background:"linear-gradient(135deg,#f0fbf7,#f4f9fe)",color:"#22445c"}}>
    <section style={{width:"100%",maxWidth:620,textAlign:"center",padding:"44px 25px",background:"#fff",border:"1px solid #dceee7",borderRadius:24,boxShadow:"0 16px 48px #1b5f5a12"}}>
      <div aria-hidden="true" style={{fontSize:62,fontWeight:900,letterSpacing:"-3px",color:"#0e9883"}}>404</div>
      <h1 style={{fontSize:"clamp(22px,4vw,30px)",margin:"10px 0 14px",fontWeight:900}}>这个页面暂时找不到</h1>
      <p style={{fontSize:15,lineHeight:1.9,color:"#61808d",margin:"0 auto 28px",maxWidth:470}}>链接可能已更新，或者地址输入有误。你可以返回首页，继续探索 AI 安全课程与互动实验。</p>
      <nav aria-label="页面恢复导航" style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",justifyContent:"center"}}>
        <Link href="/" style={{padding:"11px 18px",borderRadius:12,color:"#fff",background:"#0e9883",fontSize:14,fontWeight:800,textDecoration:"none"}}>返回首页</Link>
        <Link href="/academy" style={{padding:"11px 18px",borderRadius:12,color:"#176c6c",background:"#e9f8f2",fontSize:14,fontWeight:800,textDecoration:"none"}}>学习地图</Link>
        <Link href="/stories" style={{padding:"11px 18px",borderRadius:12,color:"#176c6c",background:"#e9f8f2",fontSize:14,fontWeight:800,textDecoration:"none"}}>安全故事馆</Link>
      </nav>
    </section>
  </main>;
}
