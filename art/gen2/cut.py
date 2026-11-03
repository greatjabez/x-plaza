import numpy as np
from PIL import Image
from scipy import ndimage as nd
D='/workspace/xplaza-deploy/art/gen2/'
def load(n):
    a=np.array(Image.open(D+n).convert('RGB')).astype(np.int16)
    mx=a.max(2);mn=a.min(2)
    bgc=(mn>228)&(mx-mn<22)
    lab,_=nd.label(bgc);edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))
    fg=~bg;fg=nd.binary_opening(fg,iterations=1)
    al=np.where(fg,255,0).astype(np.uint8)
    return a.astype(np.uint8),al
def cells(n,rows,cols):
    a,al=load(n);H,W=al.shape
    lab,k=nd.label(al>0);out={}
    sl=nd.find_objects(lab)
    for i,s in enumerate(sl):
        if s is None:continue
        area=(lab[s]==i+1).sum()
        if area<150:continue
        cy=(s[0].start+s[0].stop)/2;cx=(s[1].start+s[1].stop)/2
        r=int(cy/H*rows);c=int(cx/W*cols);out.setdefault((r,c),[]).append(i+1)
    res={}
    for (r,c),ids in out.items():
        m=np.isin(lab,ids);ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        rgba=np.dstack([a,np.where(m,255,0).astype(np.uint8)])[y0:y1,x0:x1]
        res[(r,c)]=rgba
    return res
SHEETS={'out1':(3,3),'out2':(3,3),'out3':(3,3),'out4':(1,3),'hair1':(3,3),'hair2':(3,3),'hair3':(3,3)}
if __name__=='__main__':
    for n,(r,c) in SHEETS.items():
        cs=cells(n+'.jpg',r,c)
        for (i,j),im in cs.items():Image.fromarray(im).save(D+f'cut/{n}_{i}{j}.png')
        print(n,sorted(cs.keys()))
