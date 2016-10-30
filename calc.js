onmessage = function( workerData ) {
  var d = workerData.data ;
  var id = typeof id === "undefined" ? d[ "workerID" ] : id ;
  var re = d[ "toReZ" ] ;
  var im = d[ "toImZ" ] ;
  var iv = d[ "iterVal" ] ;
  var ms = d[ "maxSq" ] ;
  var xw = re.length ;
  var yw = im.length ;
  var md = new Uint8ClampedArray( xw * yw ) ;
  // Mandelbrot Algo
  var i = 1 , p = 0 , x = 0 , y = 0 , r2 = 0 , i2 = 0 , c = [ 0 , 0 ] ;
  for(y=0;y<yw;y=y+1){
    for(x=0;x<xw;x=x+1){z=[0,0],p=x+xw*y,c=[x,y];
      for(i=1;i<=iv;i=i+1){r2=z[0]*z[0],i2=z[1]*z[1],z=[r2-i2+re[c[0]],2*z[0]*z[1]+im[c[1]]];if(r2+i2>ms){md[p]=i;break;}}if(i>iv)md[p]=iv;}}
  this.postMessage( md );
} ;
