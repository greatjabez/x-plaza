from PIL import Image,ImageDraw
# display coords on 1024x768 image. tiers bottom->top: cx,cy,rx,ry,cliff(front)
T=[(527,422,412,138,100),(522,308,300,117,78),(528,178,200,107,58)]
S=[(1,205,485,300,605),(1,757,490,855,620),(2,285,360,380,485),(2,668,360,770,490),(3,355,240,445,350),(3,605,240,695,345)]
if __name__=='__main__':
  im=Image.open('hill1024.png');d=ImageDraw.Draw(im)
  for (cx,cy,rx,ry,c),col in zip(T,['cyan','yellow','blue']):
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],outline=col,width=2);d.arc([cx-rx,cy-ry+c,cx+rx,cy+ry+c],0,180,fill=col,width=2)
  for l,a,b,c,e in S:d.rectangle([a,b,c,e],outline='white',width=2)
  im.save('/tmp/ov.png')
