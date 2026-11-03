import sys
from PIL import Image,ImageFilter
import numpy as np
def cut(src,size,dst,crop=True):
  im=Image.open(src).convert('RGB').resize(size,Image.LANCZOS);a=np.asarray(im).astype(float)
  r,g,b=a[...,0],a[...,1],a[...,2]
  # magenta-ness: high r and b relative to g
  from scipy import ndimage
  hard=(r-g>110)&(g<80)&(b>30)
  lab,n=ndimage.label(hard);edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
  sz=ndimage.sum(hard,lab,range(n+1));big=set(np.nonzero(sz>120)[0])-{0};bgc=np.isin(lab,list(edge|big));bgc=ndimage.binary_closing(bgc,iterations=2)|bgc
  soft=np.clip(((np.minimum(r,b*1.6)-g)-60)/50,0,1)
  near=ndimage.binary_dilation(bgc,iterations=2)
  m=np.where(bgc,1.0,np.where(near,soft,0.0))   # 1=bg
  al=1-m
  al=np.asarray(Image.fromarray((al*255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.6))).astype(float)/255
  # despill: pull magenta out of edge pixels
  sp=np.clip((np.minimum(r,b)-g)-40,0,None)*(al<.99)
  out=np.dstack([np.clip(r-sp*.6,0,255),g,np.clip(b-sp*.8,0,255),al*255]).astype('uint8')
  o=Image.fromarray(out,'RGBA')
  if crop:bb=o.getbbox();print(dst,'bbox',bb);o=o.crop(bb)
  o.save(dst);return o
if __name__=='__main__':
  cut('art/gen7/hill.jpg',(1024,768),'public/assets/hill.png',crop=False)
  cut('art/gen7/rocket.jpg',(576,1024),'public/assets/rocket.png')
