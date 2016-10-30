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
  var updateOverallZoomFactor = function() { overallZoom *= OPT.getZoom() } ;

  var xCenter , yCenter ;
  var updateCPlaneCenter = function() {
    xCenter = xMin + ( xPixCenter / xPixWidth ) * xWidth ;
    yCenter = yMin + ( yPixCenter / yPixWidth ) * yWidth ;
  } ;

  var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
  var xWidth = xMax - xMin ;
  var yWidth = yMax - yMin ;
  var zoomCPlaneBounds = function() {
    var z = OPT.getZoom() ;
    xMin = xCenter - ( xWidth / ( 2 * z ) ) ;
    xMax = xCenter + ( xWidth / ( 2 * z ) ) ;
    yMin = yCenter - ( yWidth / ( 2 * z ) ) ;
    yMax = yCenter + ( yWidth / ( 2 * z ) ) ;
  } ;

  var updateCPlaneWidths = function() {
    xWidth = xMax - xMin ;
    yWidth = yMax - yMin ;
  } ;

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
    var idealX = yWidth * ( xPixWidth / yPixWidth ) ;
    xMin = -3/5 * idealX , xMax = 2/5 * idealX ;
    updateCPlaneWidths() ;
  } ;

  var initWidth = function() {
    var idealY = xWidth * ( yPixWidth / xPixWidth ) ;
    yMin = - idealY / 2 , yMax = idealY / 2 ;
    updateCPlaneWidths() ;
  } ;

  var setPixWidths = function( newWidth , newHeigth ) {
    if( xPixWidth !== window.innerWidth || yPixWidth !== window.innerHeight ) {
      setXPixWidth( newWidth ) ;
      setYPixWidth( newHeigth ) ;
      ( xPixWidth > yPixWidth ? initHeight : initWidth )() ;
    }
    return this ;
  } ;

  var setDeltasPerPixel = function() {
    deltaX = ( xMax - xMin ) / xPixWidth ;
    deltaY = ( yMax - yMin ) / yPixWidth ;
    return this ;
  } ;

  var toReZ , toImZ ;
  var setPToCArrays = function() {
    toReZ = new Float64Array( xPixWidth + xRotBoundExtension ) ;
    toImZ = new Float64Array( yPixWidth + yRotBoundExtension ) ;
    for( i = 0 ; i < ( xPixWidth + xRotBoundExtension ) ; i++ ) { toReZ[i] = xMin + ( deltaX * ( i - xRotBoundOffset ) ) ; }
    for( i = 0 ; i < ( yPixWidth + yRotBoundExtension ) ; i++ ) { toImZ[i] = yMin + ( deltaY * ( i - yRotBoundOffset ) ) ; }
    return this;
  } ;

  var getToReZ = function() { return toReZ ; } ;
  var getToImZ = function( yStart , yEnd ) {
    yStart = yStart || 0 ;
    yEnd = yEnd || yPixWidth ;
    return toImZ.subarray( yStart , yEnd ) ;
  } ;

  var getTotalPixelNumber = function() {
    return toImZ.length * toReZ.length ;
  } ;

  var updateDrawParams = function( ev ) {
    setXPixCenter( ev.layerX ) ;
    setYPixCenter( ev.layerY ) ;
    OPT.updateIterOnClick() ;
    updateOverallZoomFactor() ;
    // TODO: polar parameter update with click remap
    //var rotX = OPT.isPolar() ?
    //this.rotComplex( [ xPixCenter , yPixCenter ] , this.toRad( - OPT.getRot() ) ) :
    //[ xPixCenter , yPixCenter ] ;
    //setXPixCenter( ev.layerX ) ;
    //setYPixCenter( ev.layerY ) ;
    //xPixCenter = rotX[ 0 ] ;
    //yPixCenter = rotX[ 1 ] ;
    updateCPlaneCenter() ;
    zoomCPlaneBounds() ;
    updateCPlaneWidths() ;
    return this ; 
  } ;

  var API = {
    "setPToCArrays"       : setPToCArrays ,
    "setPixWidths"        : setPixWidths ,
    "setDeltasPerPixel"   : setDeltasPerPixel ,
    "getOverallZoom"      : getOverallZoom ,
    //"setCPlaneBounds"     : setCPlaneBounds ,
    "getTotalPixelNumber" : getTotalPixelNumber ,
    "getToReZ"            : getToReZ ,
    "getToImZ"            : getToImZ ,
    "updateDrawParams"    : updateDrawParams ,
    "getYPixWidth"        : getYPixWidth ,
  } ;

  return API ;
} () ) ; // END PLANE
