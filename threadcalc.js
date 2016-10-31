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
  var xw = re.length ;
  var yw = yE - yS ;
  var xC = d[ "xOriginRotOffset" ] ;
  var yC = d[ "yOriginRotOffset" ] ;
  var md = new Uint8ClampedArray( xw * yw ) ;
  var i = 1 , p = 0 , x = 0 , y , r2 = 0 , i2 = 0 , c = [ 0 , 0 ] , z ;
  // debugger;
  console.log( xC , yC , xw , yw ) ;
  // MANDELBROT ALGO
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
  // MANDELBROT ALGO ROT
  var algoRot = function() {
    // REMAP PIXELS 
    var sTh = Math.sin(th);
    var cTh = Math.cos(th);
    for(y=0;y<yw;y=y+1){
      for(x=0;x<xw;x=x+1){
        z=[0,0];p=x+xw*y;
        c=[Math.floor((x-xC)*cTh-(y-yC+yS)*sTh),Math.floor((x-xC)*sTh+(y-yC+yS)*cTh)];
        for(i=1;i<=iv;i=i+1){
          r2=z[0]*z[0];i2=z[1]*z[1];z=[r2-i2+re[c[0]],2*z[0]*z[1]+im[c[1]]];
          if(r2+i2>ms){md[p]=i;break;}
        }
        if(i>iv)md[p]=iv;
      }
    }
  } ;
  console.log( isPolar ) ;
  ( isPolar ? algoRot : algo )() ;
  this.postMessage( [ id , md ] );
} ;