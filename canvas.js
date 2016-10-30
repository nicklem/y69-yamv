/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var CANVAS = ( function() {

  var canvas , ctx , imgData ;
  var init = function() {
    if( typeof canvas === "undefined" ) { canvas = document.querySelector( "canvas" ) ; } ;
    var newWidth = canvas.width !== window.innerWidth ;
    var newHeight = canvas.height !== window.innerHeight ;
    if( newWidth || newHeight ) {
      // TODO: check proper canvas re-init on resize
      canvas.width  = window.innerWidth || 300 ;
      canvas.height = window.innerHeight || 300 ;
      ctx = canvas.getContext( "2d" ) ;
      imgData = ctx.getImageData( 0 , 0 , canvas.width , canvas.height ) ;
    }
    return this;
  }

  var getCanvas      = function() { return canvas ; } ;
  var getWidth       = function() { return canvas.width ; } ;
  var getHeight      = function() { return canvas.height ; } ;
  var getOffsetTop   = function() { return canvas.offsetTop ; } ;
  var getOffsetLeft  = function() { return canvas.offsetLeft ; } ;
  var putImageData   = function() { ctx.putImageData( imgData, 0 , 0 ); } ;

  var colorRGB ;
  var updateColorLevelArr = function() {
    colorRGB = [] ;
    var R = 0 , G = 1 , B = 2 ;
    var innerColor = OPT.getInnerColor() ;
    var rimColor   = OPT.getRimColor() ;
    var haloColor  = OPT.getHaloColor() ;
    var outerColor = OPT.getOuterColor() ;
    var iters      = OPT.getOptionData().iter.value ;
    var haloDecay  = OPT.getOptionData().haloDecay.value ;
    var brightness = OPT.getOptionData().brightness.value ;
    for( var col = iters ; col >= 0 ; col-- ) {
      var brightnessDecay = 1 / Math.exp( col * haloDecay / 100 ) ;
      var bezierFactor = col / iters ;
      var brightMulti = brightnessDecay * brightness ;
      colorRGB.push( [
          MATH.bezier4( innerColor[ R ] , rimColor[ R ] , haloColor[R] , outerColor[ R ] , bezierFactor ) * brightMulti ,
          MATH.bezier4( innerColor[ G ] , rimColor[ G ] , haloColor[G] , outerColor[ G ] , bezierFactor ) * brightMulti ,
          MATH.bezier4( innerColor[ B ] , rimColor[ B ] , haloColor[B] , outerColor[ B ] , bezierFactor ) * brightMulti
      ] ) ;
    }
    return this ;
  } ;

  var draw = function draw() {
    var R = 0 , G = 1 , B = 2 ;
    var mThreadData = ITER.getThreadData() ;
    var threadIndex , threadDataLength;
    var numThreads = mThreadData.length ;
    for( threadIndex = 0 ; threadIndex < numThreads ; threadIndex += 1 ) {
      threadDataEl = mThreadData[ threadIndex ] ;
      threadDataLength = threadDataEl.length ;
      for( p = 0 ; p < threadDataLength ; p+=1 ) {
        RGBAPixOffset = ( threadDataLength * threadIndex + p ) * 4 ;
        imgData.data[ RGBAPixOffset     ] = colorRGB[ threadDataEl[ p ] ][ R ] ;
        imgData.data[ RGBAPixOffset + 1 ] = colorRGB[ threadDataEl[ p ] ][ G ] ;
        imgData.data[ RGBAPixOffset + 2 ] = colorRGB[ threadDataEl[ p ] ][ B ] ;
        imgData.data[ RGBAPixOffset + 3 ] = 255 ; // alpha
      }
    }
    putImageData( imgData ) ;
    return this ;
  } ;

  var redraw = function redraw( mThreadData ) {
    updateColorLevelArr() ;
    draw() ;
    return this ;
  } ;

  return {
    "init"                 : init ,
    "getCanvas"            : getCanvas ,
    "getWidth"             : getWidth ,
    "getHeight"            : getHeight ,
    "redraw"               : redraw ,
    "updateColorLevelArr"  : updateColorLevelArr ,
    "getOffsetTop"         : getOffsetTop ,
    "getOffsetLeft"        : getOffsetLeft ,
  } ;

} () ) ;
