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

  var canvas ;
  var ctx ;
  var initCanvas = function() {
    canvas = document.querySelector( "canvas" ) , ctx, imgData  ;
    canvas.width  = xPixWidth = window.innerWidth || 300 ;
    canvas.height = yPixWidth = window.innerHeight || 300 ;
    return this;
  } ;

  var initContext = function() {
    ctx = canvas.getContext( "2d" ) ;
    imgData = ctx.getImageData( 0 , 0 , xPixWidth , yPixWidth ) ;
    return this;
  }

  var getCanvas      = function() { return canvas ; } ;
  var getWidth       = function() { return canvas.width ; } ;
  var getHeight      = function() { return canvas.height ; } ;
  var getOffsetTop   = function() { return canvas.offsetTop ; } ;
  var getOffsetLeft  = function() { return canvas.offsetLeft ; } ;

  var imgData ;
  var setImgData = function( newVal ) { imgData = newVal ; } ;

  var colorRGB ;
  var updateColorLevelArr = function() {
    colorRGB = [] ;
    var innerColor = OPT.getInnerColor() ;
    var rimColor   = OPT.getRimColor() ;
    var haloColor  = OPT.getHaloColor() ;
    var outerColor = OPT.getOuterColor() ;
    var R = 0 , G = 1 , B = 2 ;
    for( var col = OPT.getOptionData().iter.value ; col >= 0 ; col-- ) {
      var brightnessDecay = 1 / Math.exp( col * OPT.getOptionData().haloDecay.value / 100 ) ;
      var bezierFactor = col / OPT.getOptionData().iter.value ;
      var brightMulti = brightnessDecay * OPT.getOptionData().brightness.value ;
      colorRGB.push( [
          MATH.bezier4( innerColor[ R ] , rimColor[ R ] , haloColor[R] , outerColor[ R ] , bezierFactor ) * brightMulti ,
          MATH.bezier4( innerColor[ G ] , rimColor[ G ] , haloColor[G] , outerColor[ G ] , bezierFactor ) * brightMulti ,
          MATH.bezier4( innerColor[ B ] , rimColor[ B ] , haloColor[B] , outerColor[ B ] , bezierFactor ) * brightMulti
      ] ) ;
    }
    return this ;
  } ;

  var putImageData = function() { ctx.putImageData( imgData, 0 , 0 ); }

  this.draw = function draw() {
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
    ITER.resetThreadData() ;
    putImageData( imgData ) ;
    return this ;
  } ;

  var redraw = function redraw() {
    updateColorLevelArr() ;
    draw() ;
    //UTIL.consoleLog( "Zoom level" , getZoom() , fracCtl ) ;
    return this ;
  } ;


  return {
    "initCanvas"           : initCanvas ,
    "initContext"          : initContext ,
    "getCanvas"            : getCanvas ,
    "getWidth"             : getWidth ,
    "getHeight"            : getHeight ,
    "redraw"               : redraw ,
    "updateColorLevelArr"  : updateColorLevelArr ,
    "getOffsetTop"         : getOffsetTop ,
    "getOffsetLeft"        : getOffsetLeft ,
  } ;

} () ) ;
