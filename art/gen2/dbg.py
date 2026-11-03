from build import *
for f in ['out1_00','out1_10','out1_20','out2_00','out2_10','out4_00','out3_00','hair1_00','hair1_10','hair3_00','hair2_00','hair2_10','hair3_10','hair1_01','hair3_11']:
    a=L(f);sk=skin_of(a);lim=.4 if f.startswith('out') else .75
    es=eyes(a,sk,2,lim);print(f,a.shape[:2],'skin',sk.astype(int),'eyes',[((s[1].start+s[1].stop)//2,(s[0].start+s[0].stop)//2,s[1].stop-s[1].start,s[0].stop-s[0].start) for s in es])
