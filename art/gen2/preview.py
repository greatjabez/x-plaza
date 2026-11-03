import json,sys;from PIL import Image
M=json.load(open('/workspace/xplaza-deploy/public/assets/chars_meta.json'));A=Image.open('/workspace/xplaza-deploy/public/assets/chars_atlas.png');CW,CH=M['cell'];C=M['cols']
cell=lambda i:A.crop(((i%C)*CW,(i//C)*CH,(i%C+1)*CW,(i//C+1)*CH))
def over(c,im,dx,dy):
    t=Image.new('RGBA',c.size);t.paste(im,(int(round(dx)),int(round(dy))),im);c.alpha_composite(t)
def comp(o,h,hc,hat,v,sk=0):
    b=M['body'][o][v];c=cell(b['i'][sk]).copy();dx,dy=b['a'][0]-M['ax'],b['a'][1]-M['ay']
    over(c,cell(M['hair'][h][v]['i'][hc]),dx,dy)
    if hat:over(c,cell(M['hat'][hat][v]['i']),dx,dy)
    return c
combos=[('tunic','fluffy',0,None),('dress','buns',1,None),('rain','wavy',4,'straw'),('overalls','spiky',2,None),('knight','bob',3,'beanie'),('hanbokM','fluffy',3,None),('hanbokF','pony',1,None)]
out=Image.new('RGBA',(CW*len(combos),CH*3),(230,243,220,255))
for i,(o,h,hc,hat) in enumerate(combos):
  for v in range(3):out.alpha_composite(comp(o,h,hc,hat,v,i%3),(i*CW,v*CH))
out=out.resize((out.width*2,out.height*2),Image.LANCZOS);out.save('preview2.png')
