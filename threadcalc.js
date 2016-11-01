onmessage = function( workerData ) {
  var d = workerData.data ;
  var id = typeof id === "undefined" ? d[ "workerID" ] : id ;
  var isPolar =  d[ "isPolar" ] ;
  var th = d[ "rotationAngle" ] ;
  var re = d[ "toReZ" ] ;
  var im = d[ "toImZ" ] ;
  var iv = d[ "iterVal" ] ;
  var ms = d[ "maxSq" ] ;
  var yS = d[ "yStart" ] ;
  var yE = d[ "yEnd" ] ;
  var xw = d[ "xWidth" ];
  var yw = yE - yS ;
  var xRO = d[ "xOriginRotOffset" ] ;
  var yRO = d[ "yOriginRotOffset" ] ;
  var xBO = d[ "xRotBoundOffset" ] ;
  var yBO = d[ "yRotBoundOffset" ] ;
  
  var md = new Uint8ClampedArray( xw * yw ) ;
  var i = 1 , p = 0 , x = 0 , y , r2 = 0 , i2 = 0 , c = [ 0 , 0 ] , z ;
  
  // CARTESIAN MANDELBROT ENGINE
  var algo = function() {
    for(y=0;y<yw;y=y+1){
      for(x=0;x<xw;x=x+1){
        z=[0,0];p=x+xw*y;
        c=[x,(y+yS)];
        for(i=1;i<=iv;i=i+1){
          r2=z[0]*z[0];i2=z[1]*z[1];z=[r2-i2+re[c[0]],2*z[0]*z[1]+im[c[1]]];
          if(r2+i2>ms){md[p]=i;break;}
        }
        if(i>iv)md[p]=iv;
      }
    }
  } ;
  
  // POLAR MANDELBROT ENGINE
  var algoRot = function() {
    var sTh = Math.sin(th);
    var cTh = Math.cos(th);
    var xSliceTrans , ySliceTrans , xRot , yRot , xT , yT , xTR ,yTR , xI , yI, yTsTh , yTcTh ;
    xSliceTrans=-xRO;               // slice x remapped to offset rotation (or it'll "hinge" on top left pixel)
    ySliceTrans=-yRO;               // slice y remapped to offset rotation (or it'll "hinge" on top left pixel)
    ySliceTrans+=yS;                // y slice offset remapping, every thread has its own slice
    for(y=0;y<yw;y=y+1){
      yT=y+ySliceTrans;             // trans y as defined above
      yTsTh=yT*sTh;yTcTh=yT*cTh;    // precalc trig multiplications on y for efficiency
      for(x=0;x<xw;x=x+1){
        xT=x+xSliceTrans;           // trans x as defined above
        xRot=xT*cTh-yTsTh;          // rot x coord
        yRot=xT*sTh+yTcTh;          // rot y coord
        xTR=xRot+xBO;yTR=yRot+yBO;  // trans to offset bound extension 
        xI=Math.floor(xTR);         // to index for toReZ array
        yI=Math.floor(yTR);         // to index for toImZ array
        z=[0,0];p=x+xw*y;
        c=[xI,yI];
        for(i=1;i<=iv;i=i+1){
          r2=z[0]*z[0];
          i2=z[1]*z[1];
          z=[r2-i2+re[c[0]],2*z[0]*z[1]+im[c[1]]];
          if(r2+i2>ms){md[p]=i;break;}
        }
        if(i>iv)md[p]=iv;
      }
    }
  } ;
  
  ( isPolar ? algoRot : algo )() ;
  this.postMessage( [ id , md ] );
} ;