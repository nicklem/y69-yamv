/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var PLANE = ( function() {

  var overallZoom = 1 ;
  var getOverallZoom = function() { return overallZoom ; } ;
  var setOverallZoom = function( newVal ) { overallZoom = newVal ; } ;

  var xCenter ;
  var setXCenter = function(xCenter) { xCenter = xCenter; } 
  var getXCenter = function() { return xCenter; } 

  var yCenter ;
  var setYCenter = function(yCenter) { yCenter = yCenter; } 
  var getYCenter = function() { return yCenter; } 

  var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
  var xWidth = xMax - xMin ;
  var yWidth = yMax - yMin ;
  var setBounds = function ( xMinVal , xMaxVal , yMinVal , yMaxVal ) {
    xMin = xMinVal , xMax = xMaxVal , yMin = yMinVal , yMax = yMaxVal ;
    xWidth = xMax - xMin ;
    yWidth = yMax - yMin ;
    return this;
  } ;
  var getXMin = function() { return xMin; } 
  var getXMax = function() { return xMax; } 
  var getYMin = function() { return yMin; } 
  var getYMax = function() { return yMax; } 

  // TODO
  var deltaX , deltaY ;

  var xPixWidth ;
  var geTXPIXWidth = function() { return xPixWidth ; } ;
  var setXPixWidth = function( newVal ) { xPixWidth = newVal ; } ;

  var yPixWidth ;
  var getYPixWidth = function() { return yPixWidth ; } ;
  var setYPixWidth = function( newVal ) { yPixWidth = newVal ; } ;

  var xPixCenter ;
  var getXPixCenter = function() { return xPixCenter ; } ;
  var setXPixCenter = function( newVal ) {
    xPixCenter = newVal - CANVAS.getOffsetLeft() ;
  } ;

  var yPixCenter ;
  var getYPixCenter = function() { return yPixCenter ; } ;
  var setYPixCenter = function( newVal ) {
    yPixCenter = newVal - CANVAS.getOffsetTop() ;
  } ;

  var xRotBoundOffset = 0 ;
  var getXRotBoundOffset = function() { return xRotBoundOffset ; } ;
  var setXRotBoundOffset = function( newVal ) {
    xRotBoundOffset = newVal ;
    xRotBoundExtension = 2 * xRotBoundOffset ;
  } ;

  var yRotBoundOffset = 0;
  var getYRotBoundOffset = function() { return yRotBoundOffset ; } ;
  var setYRotBoundOffset = function( newVal ) {
    yRotBoundOffset = newVal ;
    yRotBoundExtension = 2 * yRotBoundOffset ;
  } ;

  var yRotBoundExtension = 0;
  var getYRotBoundExtension = function() { return yRotBoundExtension ; } ;

  var xRotBoundExtension = 0 ;
  var getXRotBoundExtension = function() { return xRotBoundExtension ; } ;

  var toPixMod , toPixPhi , rotCalc = 0 ;
  var getToPixPhi = function() { return toPixPhi ; } ;
  var getToPixMod = function() { return toPixMod ; } ;

  var initHeight = function() {
    var idealX = ( yMax - yMin ) * ( xPixWidth / yPixWidth ) ;
    xMin = -3/5 * idealX , xMax = 2/5 * idealX ;
    xWidth = xMax - xMin ;
    yWidth = yMax - yMin ;
  } ;

  var initWidth = function() {
    var idealY = ( yMax - yMin ) * ( yPixWidth / xPixWidth ) ;
    yMin = - idealY / 2 , yMax = idealY / 2 ;
    xWidth = xMax - xMin ;
    yWidth = yMax - yMin ;
  } ;

  var setPixWidths = function( newWidth , newHeigth ) {
    if( xPixWidth !== window.innerWidth || yPixWidth !== window.innerHeight ) {
      setXPixWidth( newWidth ) ;
      setYPixWidth( newHeigth ) ;
      ( xPixWidth > yPixWidth ? initHeight : initWidth )() ;
    }
    return this ;
  } ;

  //var setCPlaneBounds = function( xMinVal , xMaxVal , yMinVal , yMaxVal ) {
  //} ;

  var setDeltasPerPixel = function() {
    deltaX = ( xMax - xMin ) / xPixWidth ;
    deltaY = ( yMax - yMin ) / yPixWidth ;
    return this ;
  } ;

  var toReZ , toImZ ;
  var setPToCArrays = function setPToCArrays() {
    toReZ = new Float64Array( xPixWidth + xRotBoundExtension ) ;
    toImZ = new Float64Array( yPixWidth + yRotBoundExtension ) ;
    for( i = 0 ; i < ( xPixWidth + xRotBoundExtension ) ; i++ ) { toReZ[i] = xMin + ( deltaX * ( i - xRotBoundOffset ) ) ; }
    for( i = 0 ; i < ( yPixWidth + yRotBoundExtension ) ; i++ ) { toImZ[i] = yMin + ( deltaY * ( i - yRotBoundOffset ) ) ; }
    return this;
  } ;

  var getToReZ = function() { return toReZ ; } ;
  var getToImZ = function( yStart , yEnd ) {
    yStart  = yStart  || 0 ;
    yEnd    = yEnd    || yPixWidth ;
    return toImZ.subarray( yStart , yEnd ) ;
  } ;

  var getTotalPixelNumber = function() {
    return toImZ.length * toReZ.length ;
  } ;

  var updateDrawParams = function updateDrawParams( ev ) {
    maxSq = OPT.getMaxSq() ;
    if( !! ev ) { // onClick update, as opposed to form submit update
      // update iter count
      OPT.updateIterOnClick() ;
      setXPixCenter( ev.layerX ) ;
      setYPixCenter( ev.layerY ) ;
      // update center
      // remap click event if plane rotated
      var rotX = OPT.isPolar() ?
        this.rotComplex( [ xPixCenter , yPixCenter ] , this.toRad( -OPT.getOptionData().rot.value ) ) :
        [ xPixCenter , yPixCenter ] ;
      xPixCenter = rotX[ 0 ] ;
      yPixCenter = rotX[ 1 ] ;
      // update center to complex plane
      setOverallZoom( getOverallZoom() * OPT.getZoom() ) ;
      xCenter = xMin + ( xPixCenter / xPixWidth ) * xWidth ;
      yCenter = yMin + ( yPixCenter / yPixWidth ) * yWidth ;
      xMin = xCenter - ( xWidth / ( 2 * getOverallZoom() ) ) ;
      xMax = xCenter + ( xWidth / ( 2 * getOverallZoom() ) ) ;
      yMin = yCenter - ( yWidth / ( 2 * getOverallZoom() ) ) ;
      yMax = yCenter + ( yWidth / ( 2 * getOverallZoom() ) ) ;
      console.log( getOverallZoom() ) ;
    }
    return this ; 
  } ;

  var API = {
    "setPToCArrays"       : setPToCArrays ,
    "setPixWidths"        : setPixWidths ,
    "setDeltasPerPixel"   : setDeltasPerPixel ,
    "getOverallZoom"      : getOverallZoom ,
    "setOverallZoom"      : setOverallZoom ,
    "setBounds"           : setBounds ,
    "getTotalPixelNumber" : getTotalPixelNumber ,
    "getToReZ"            : getToReZ ,
    "getToImZ"            : getToImZ ,
    "updateDrawParams"    : updateDrawParams ,
  } ;

  return API ;
} () ) ; // END PLANE



//var setXMin = function(xMin) { this.xMin = xMin; } 
//var setXMax = function(xMax) { this.xMax = xMax; } 
//var setYMin = function(yMin) { this.yMin = yMin; } 
//var setYMax = function(yMax) { this.yMax = yMax; } 
