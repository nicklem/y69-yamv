/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

// TODO:
// display coord bounds and save coord history vector
// antialiasing
// image export
// mobile styles
//


var FRAC_CTL = ( function FRAC_CTL() {

  this.populateViewportPolarArrays = function() {
    var curPixel , offsetXCoord , offsetYCoord ;
    var yPixWidthRot = yPixWidth + yRotBoundExtension ;
    var xPixWidthRot = xPixWidth + xRotBoundExtension ;
    toPixMod = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
    toPixPhi = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
    for( var yCoord = yRotBoundOffset , offsetYCenter = yRotBoundOffset + Math.round( yPixWidth / 2 ) ; yCoord < yPixWidthRot ; yCoord++ ) {
      for( var xCoord = xRotBoundOffset , offsetXCenter = xRotBoundOffset + Math.round( xPixWidth / 2 ) ; xCoord < xPixWidthRot ; xCoord++ ) {
        offsetXCoord  = xCoord - offsetXCenter ;
        offsetYCoord  = yCoord - offsetYCenter ;
        curPixel      = xCoord + yCoord * xPixWidth ;
        toPixMod[ curPixel ] = 2 * Math.PI + Math.sqrt( offsetXCoord * offsetXCoord + offsetYCoord * offsetYCoord ) ;
        toPixPhi[ curPixel ] = 2 * Math.PI + Math.atan( offsetXCoord === 0 ? offsetYCoord / 0.0000001 : offsetYCoord / offsetXCoord ) ;
        toPixPhi[ curPixel ] += offsetXCoord < 0 ? Math.PI : 0 ;
        // TODO: special fx!
        //if( true ) {
        //if( toPixPhi[ curPixel ] > Math.PI / 1 )
        //toPixPhi[ curPixel ] = ( Math.round( 1000 * toPixPhi[ curPixel ] ) % ( Math.PI * 1000 / 1 ) ) / 1000 ;
        //}
      }
    }
    return this;
  } ;

  this.calcRotBoundExtension = function() {
    if( OPT.isPolar() ) {
      var l = xPixWidth / 2 , h = yPixWidth / 2 ;
      var diag = Math.sqrt( l * l + h * h ) ;
      var pinchCorrection = 10 ;
      xRotBoundOffset = yRotBoundOffset = Math.ceil( diag - ( l < h ? l : h ) ) + pinchCorrection ;
      xRotBoundExtension = 2 * xRotBoundOffset ;
      yRotBoundExtension = 2 * xRotBoundOffset ;
    } else {
      xRotBoundOffset = yRotBoundOffset = xRotBoundExtension = yRotBoundExtension = 0 ; 
    }
  } ;

  //this.calcPrep = function() {
  //if( OPT.isPolar() ) {
  //rotCalc = OPT.getOptionData().rot.value ;
  //}
  //return this ;
  //} ;

  // SINGLE THREAD CALC

  //this.singleThreadCalc = function() {
  //this.initCalc() ;
  //var angleUpdateRad = - Math.PI * OPT.getOptionData().rot.value / 180 ; 
  //var iter = 1 , rotTransform ;
  //var yCoord , xCoord , curPixel , z , zReSq , zImSq , c ;
  //var Re = 0 , Im = 1 ;
  ////console.log( mThreadData ) ;
  //for( yCoord = 0 ; yCoord < toImZ.length ; yCoord++ ) {
  //for( xCoord = 0 ; xCoord < toReZ.length ; xCoord++ ) {
  //z = [ 0 , 0 ] ;
  //curPixel = ( xCoord ) + xPixWidth * ( yCoord ) ;
  //if( OPT.getOptionData().renderEngine.value === "Polar" ) {
  //rotTransform = angleUpdateRad + toPixPhi[ curPixel ] ;
  //complexPixel= [
  //Math.round( xPixWidth / 2 + Math.cos( rotTransform ) * toPixMod[ curPixel ] + xRotBoundOffset ) ,
  //Math.round( yPixWidth / 2 + Math.sin( rotTransform ) * toPixMod[ curPixel ] + yRotBoundOffset ) ,
  //] ;
  //} else {
  //complexPixel = [ xCoord , yCoord ] ;
  //}
  //// MANDELBROT ALGO
  //for( iter = 1 ; iter <= OPT.getOptionData().iter.value ; iter++ ) {
  //zReSq = z[ Re ] * z[ Re ] , zImSq = z[ Im ] * z[ Im ] ;
  //z = [ zReSq - zImSq + toReZ[ complexPixel[ Re ] ] , 2 * z[ Re ] * z[ Im ] + toImZ[ complexPixel[ Im ] ] ] ;
  //if( zReSq + zImSq > maxSq ) { // iterations diverge
  //mThreadData[ 0 ][ curPixel ] = iter ;
  //break ;
  //}
  //}
  //if( iter > OPT.getOptionData().iter.value ) { // iterations converge
  //mThreadData[ 0 ][ curPixel ] = OPT.getOptionData().iter.value ;
  //}
  //// END MANDELBROT ALGO
  //}
  //}
  //// TODO: THIS SHOULDN"T BE HERE
  //this.redraw();
  //} ;

  // MULTI THREAD WORKER FUNCTION

  // API

  this.showThreads = function() {
    UTIL.consoleLog( "Multithread" , ITER.hasWorkers ? ITER.maxThreads() : "No" ) ;
    return this ;
  } ;

  this.init = function() {
    CANVAS.init() ;
    PLANE.setPixWidths( CANVAS.getWidth() , CANVAS.getHeight() ) ;
    this.render() ;
    return this ;
  } ;

  this.render = function render() {
    PLANE.setDeltasPerPixel().setPToCArrays() ;
    ITER.initCalc( PLANE.getTotalPixelNumber() ) ;
    //if( OPT.isPolar() ) {
    //ITER.initPolarCalc() ;
    //}
    ITER.execCalc() ;
    //this.redraw() ;
    return this ;
  } ;

  this.listen = function listen() {
    CANVAS.getCanvas().addEventListener( "click" , function( ev ) {
      CONTROLS.mapControls() ;
      PLANE.updateDrawParams( ev ) ;
      this.init() ;
      CONTROLS.createControls().render() ;
    }.bind( this ) ) ;
    return this ;
  } ;

  return this ;

}.bind({}) () ) ;
