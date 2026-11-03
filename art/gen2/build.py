import numpy as np,json
from PIL import Image
from scipy import ndimage as nd
D='/workspace/xplaza-deploy/art/gen2/cut/';CW,CH=112,132;CX=56;FOOT=130;YREF=70
SK0=np.array([255,226,192.])
def L(f):return np.array(Image.open(D+f+'.png')).astype(np.float32)
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def skinmask(a):return (np.sqrt(((a[...,:3]-SK0)**2).sum(2))<45)&(a[...,3]>0)
def eyes(a,n,lim):
    h=a.shape[0];dark=(lum(a)<95)&(a[...,3]>0);dark[int(h*lim):]=0
    dark=nd.binary_opening(dark,structure=np.ones((5,5)));lab,k=nd.label(dark)
    objs=sorted([((lab[s]==i+1).sum(),s) for i,s in enumerate(nd.find_objects(lab))],key=lambda t:-t[0])[:n]
    return [((s[1].start+s[1].stop)/2,(s[0].start+s[0].stop)/2,s) for ar,s in objs]
def neck(a,y0,y1):
    m=skinmask(a);best=None
    for y in range(int(y0),int(y1)):
        xs=np.where(m[y])[0]
        if len(xs)<3:continue
        w=xs.max()-xs.min()
        if best is None or w<best[0]:best=(w,y,(xs.max()+xs.min())/2)
    return best[2],best[1]
def anchor(a,v,lim):
    if v==0:
        e=eyes(a,2,lim);e.sort();return ((e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2),abs(e[1][0]-e[0][0])
    if v==1:
        b=a.copy();b[:,int(a.shape[1]*.55):,3]=0;e=eyes(b,1,lim);ey=int(e[0][1]);m=skinmask(a)
        xs=np.where(m[ey-3:ey+4].any(0))[0];return (xs.min(),e[0][1]),None
    return None,None
def backanchor(a,f,lim=.4):
    (fx,fy),_=anchor(f,0,lim);ft=np.where((f[...,3]>0).any(1))[0].min();al=a[...,3]>0;t=np.where(al.any(1))[0].min()
    rows=al[t:t+max(3,int(a.shape[0]*.08))].any(0);xs=np.where(al[t+int((fy-ft)*.5)])[0]
    return ((xs.min()+xs.max())/2, t+(fy-ft))
def place2(a,sx,sy,ax,ay,tx,ty):
    im=Image.fromarray(a.astype(np.uint8));w,h=im.size;im=im.resize((max(1,round(w*sx)),max(1,round(h*sy))),Image.LANCZOS)
    c=Image.new('RGBA',(CW,CH));c.alpha_composite(im,(int(round(tx-ax*sx)),int(round(ty-ay*sy))));return c
def place(a,s,ax,ay,tx,ty):
    im=Image.fromarray(a.astype(np.uint8));w,h=im.size;im=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    c=Image.new('RGBA',(CW,CH));c.alpha_composite(im,(int(round(tx-ax*s)),int(round(ty-ay*s))));return c
SKINS=[(255,228,207),(246,203,166),(217,164,124)]
def recolor_skin(c,t):
    a=np.array(c).astype(np.float32);m=skinmask(a);a[m,:3]=np.clip(a[m,:3]*(np.array(t)/SK0),0,255);return Image.fromarray(a.astype(np.uint8))
cells=[];meta={'cell':[CW,CH],'ax':CX,'ay':YREF,'body':{},'hair':{},'hat':{},'skins':['#%02x%02x%02x'%t for t in SKINS]}
def add(c):cells.append(c);return len(cells)-1
r=L('out1_00');_,ed=anchor(r,0,.4);EDT=ed*120/r.shape[0];print('EDT',EDT)
OUT=[('tunic','out1',0),('dress','out1',1),('rain','out1',2),('overalls','out2',0),('knight','out2',1),('hanbokM','out4',0),('hanbokF','out3',0)]
for name,sh,row in OUT:
    fa=[L(f'{sh}_{row}{v}') for v in range(3)];_,ed=anchor(fa[0],0,.4);s=EDT/ed;meta['body'][name]=[]
    for v in range(3):
        a=fa[v];h=a.shape[0];ty0=FOOT-h*s
        if v<2:(ax,ay),_=anchor(a,v,.4)
        else: ax,ay=backanchor(a,fa[0])
        if v==0:cx=CX-(ax-a.shape[1]/2)*s*0  # keep figure centered by bbox
        c=place(a,s,a.shape[1]/2,h,CX,FOOT)
        A=(CX+(ax-a.shape[1]/2)*s,FOOT-(h-ay)*s)
        eb=[]
        if v<2:
            for ex,ey,sl in eyes(a,2 if v==0 else 1,.4):eb.append([round(CX+(sl[1].start-a.shape[1]/2)*s,1),round(FOOT-(h-sl[0].start)*s,1),round((sl[1].stop-sl[1].start)*s,1),round((sl[0].stop-sl[0].start)*s,1)])
        _a=np.array(c);_a[:int(A[1]-EDT*0.8),:,3]=0;c=Image.fromarray(_a)
        idx=[add(recolor_skin(c,t)) for t in SKINS]
        meta['body'][name].append({'i':idx,'a':[round(A[0],1),round(A[1],1)],'eyes':eb,'sleeve':'#%02x%02x%02x'%tuple(int(x) for x in a[int(h*.6),int(a.shape[1]*.5),:3])})
tb=meta['body']['tunic'];_c=np.array(cells[tb[1]['i'][0]]);_A=tb[1]['a'];_r=_c[int(_A[1])-2:int(_A[1])+3,:,3].any(0);SIDE_R=np.where(_r)[0].max()-_A[0];print('SIDE_R',SIDE_R)
HEADC=[]
for _v in range(3):
    _c=np.array(cells[tb[_v]['i'][0]])[...,3]>0;_A=tb[_v]['a'];_xs=np.where(_c[int(_A[1])])[0];HEADC.append((_xs.min()+_xs.max())/2-_A[0])
print('HEADC',HEADC)
HAIR=[('fluffy','hair1',0),('buns','hair1',1),('spiky','hair3',0),('wavy','hair2',0),('bob','hair2',1),('pony','hair3',1)]
HC=[(134,182,236),(244,169,198),(154,106,74),(69,64,79),(241,210,127),(188,166,236),(159,220,198)]
def hairmask(a,eb,ay=None,ed=None):
    blue=(a[...,2]>a[...,0]+25)&(a[...,2]>a[...,1]+3)&(a[...,3]>0)
    for _,_,s in eb:blue[s]=0
    lab,k=nd.label(blue);sizes=nd.sum(blue,lab,range(1,k+1));keep=np.isin(lab,[i+1 for i,z in enumerate(sizes) if z>800])
    keep=nd.binary_closing(keep,iterations=3);hl=nd.binary_fill_holes(keep)&~keep;hlab,hk=nd.label(hl);hs=nd.sum(hl,hlab,range(1,hk+1));keep=keep|(np.isin(hlab,[i+1 for i,z in enumerate(hs) if z<500])&~nd.binary_dilation(skinmask(a),iterations=2))
    dk=(lum(a)<125)&(a[...,3]>0)&~skinmask(a);grow=nd.binary_dilation(keep,iterations=2)&dk
    if ay is not None:
        nsk=nd.binary_dilation(skinmask(a),iterations=4);nsk[:int(ay+ed*0.9)]=0;grow&=~nsk;keep&=~(nsk&(lum(a)<120))
    for _,_,s in eb:grow[max(0,s[0].start-8):s[0].stop+8,max(0,s[1].start-8):s[1].stop+8]=0
    return (keep&~skinmask(a))|grow
def tint(a,m,col):
    o=a.copy();Lm=np.median(lum(a)[m&(lum(a)>110)]);k=(lum(a)/Lm)[...,None]
    o[...,:3]=np.clip(np.array(col)*k,0,255);o[...,3]=np.where(m,a[...,3],0);return o
# body anchor for tunic in cell (reference for hair+hats placement is per-view anchor -> (CX,YREF))
for name,sh,row in HAIR:
    fa=[L(f'{sh}_{row}{v}') for v in range(3)];_,ed=anchor(fa[0],0,.75);s=EDT/ed;meta['hair'][name]=[]
    for v in range(3):
        a=fa[v];h=a.shape[0]
        if v<2:
            (ax,ay),_=anchor(a,v,.75);b=a.copy()
            if v==1:b[:,int(a.shape[1]*.55):,3]=0
            eb=eyes(b,2 if v==0 else 1,.75)
        else:(ax,ay),eb=backanchor(a,fa[0],.75),[]
        m=hairmask(a,eb,ay if v<2 else None,ed);sx=s
        if v==1:
            Rb=np.where(m[int(ay)-2:int(ay)+3].any(0))[0].max()-ax
            Rf=SIDE_R
            if Rb*s<Rf+4: sx=(Rf+4)/Rb
        def clr(c,v=v):
            if v!=0:return c
            a_=np.array(c);yy,xx=np.mgrid[0:CH,0:CW];z=((xx-CX)/(EDT*0.78))**2+((yy-(YREF+EDT*0.55))/(EDT*0.95))**2<1;a_[z,3]=0;return Image.fromarray(a_)
        meta['hair'][name].append({'i':[add(clr(place2(tint(a,m,c),sx,s,ax,ay,CX,YREF))) for c in HC]})
# hats: positioned relative to tunic head anchors
tb=meta['body']['tunic'];tc=np.array(cells[tb[0]['i'][0]]);al=tc[...,3]>0;top=np.where(al.any(1))[0].min()
for name,sh,row,wk,by in [('straw','out3',1,1.75,0.62),('beanie','out3',2,1.32,0.78)]:
    meta['hat'][name]=[]
    for v in range(3):
        a=L(f'{sh}_{row}{v}');HWv=40.0;s=HWv*wk/a.shape[1]
        A=tb[v]['a'];yb=top+(tb[0]['a'][1]-top)*by*2.0 if False else top+ (tb[0]['a'][1]-top)*by
        # place hat bottom-center at (A.x, yb) then express relative to anchor
        c=place(a,s,a.shape[1]/2,a.shape[0],CX+HEADC[v],yb-A[1]+YREF+ (tb[0]['a'][1]-tb[v]['a'][1])*0)
        meta['hat'][name].append({'i':add(c)})
N=len(cells);COLS=16;rows=(N+COLS-1)//COLS;at=Image.new('RGBA',(COLS*CW,rows*CH))
for i,c in enumerate(cells):at.alpha_composite(c,((i%COLS)*CW,(i//COLS)*CH))
at.save('/workspace/xplaza-deploy/public/assets/chars_atlas.png',optimize=True);meta['cols']=COLS
json.dump(meta,open('/workspace/xplaza-deploy/public/assets/chars_meta.json','w'));print('cells',N)

# ---------- exact concept-art defaults (boy/girl), used when look matches the preset
def concept_figs():
    a=np.array(Image.open('/workspace/pixel-plaza/char_concept.png').convert('RGB')).astype(np.int16)[70:255]
    bg=np.sqrt(((a-np.array([255,243,219]))**2).sum(2))<28
    lab,_=nd.label(bg);edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0};fg=~np.isin(lab,list(edge))
    fg=nd.binary_opening(fg,iterations=1);lab,k=nd.label(fg);objs=[]
    for i,s in enumerate(nd.find_objects(lab)):
        if (lab[s]==i+1).sum()>2500:objs.append(s)
    objs.sort(key=lambda s:s[1].start);out=[]
    for s in objs:
        m=lab[s]>0;rg=np.dstack([a[s].astype(np.uint8),np.where(m,255,0).astype(np.uint8)]);im=Image.fromarray(rg);im=im.resize((im.width*3,im.height*3),Image.NEAREST);out.append(np.array(im).astype(np.float32))
    return out
cf=concept_figs();print('concept figs',len(cf),[c.shape[:2] for c in cf])
CHAIR={'boy':lambda a:(a[...,2]>a[...,0]+25)&(a[...,2]>a[...,1]+3),'girl':lambda a:(a[...,0]>200)&(a[...,0]>a[...,1]+35)&(a[...,2]>a[...,1]+5)}
meta['concept']={}
(_,_),_edg=anchor(cf[3],0,.6);SG=EDT/_edg
for name,off in [('boy',0),('girl',3)]:
    fa=cf[off:off+3];s=SG;meta['concept'][name]=[]
    for v in range(3):
        a=fa[v];h=a.shape[0]
        if v<2:(ax,ay),_=anchor(a,v,.6)
        else:ax,ay=backanchor(a,fa[0],.6)
        c=place(a,s,a.shape[1]/2,h,CX,FOOT);A=(CX+(ax-a.shape[1]/2)*s,FOOT-(h-ay)*s)
        hm=CHAIR[name](a)&(a[...,3]>0);hm[int(h*.55):]=0;hm=nd.binary_dilation(hm,iterations=2)&(a[...,3]>0)
        if v==0:
            for ex,ey,sl in eyes(a,2,.6):hm[max(0,sl[0].start-4):sl[0].stop+4,max(0,sl[1].start-4):sl[1].stop+4]=0
        ha=a.copy();ha[...,3]=np.where(hm,a[...,3],0);hc=place(ha,s,a.shape[1]/2,h,CX,FOOT)
        eb=[]
        if v<2:
            for ex,ey,sl in eyes(a,2 if v==0 else 1,.6):eb.append([round(CX+(sl[1].start-a.shape[1]/2)*s,1),round(FOOT-(h-sl[0].start)*s,1),round((sl[1].stop-sl[1].start)*s,1),round((sl[0].stop-sl[0].start)*s,1)])
        meta['concept'][name].append({'i':add(c),'h':add(hc),'a':[round(A[0],1),round(A[1],1)],'eyes':eb,'sleeve':'#%02x%02x%02x'%tuple(int(x) for x in a[int(h*.6),int(a.shape[1]*.5),:3])})
N=len(cells);rows=(N+COLS-1)//COLS;at=Image.new('RGBA',(COLS*CW,rows*CH))
for i,c in enumerate(cells):at.alpha_composite(c,((i%COLS)*CW,(i//COLS)*CH))
at.save('/workspace/xplaza-deploy/public/assets/chars_atlas.png',optimize=True)
json.dump(meta,open('/workspace/xplaza-deploy/public/assets/chars_meta.json','w'));print('cells',N)
