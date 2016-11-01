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

  // var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
  var xMin = -2 , xMax = 2 , yMin = -1.5 , yMax = 1.5 ;
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
  var setDeltasPerPixel = function() {
    deltaX = ( xMax - xMin ) / xPixWidth ;
    deltaY = ( yMax - yMin ) / yPixWidth ;
    return this ;
  } ;

  var xPixWidth ;
  // var geTXPIXWidth = function() { return xPixWidth ; } ;
  var getXPixWidth = function() { return xPixWidth ; } ;
  var getExtendedXPixWidth = function() { return xPixWidth + xRotBoundExtension ; } ;
  var setXPixWidth = function( newVal ) { xPixWidth = newVal ; } ;

  var yPixWidth ;
  var getYPixWidth = function() { return yPixWidth ; } ;
  var getExtendedYPixWidth = function() { return yPixWidth + yRotBoundExtension ; } ;
  var setYPixWidth = function( newVal ) { yPixWidth = newVal ; } ;

  var xPixCenter ;
  // var getXPixCenter = function() { return xPixCenter ; } ;
  var setXPixCenter = function( newVal ) { xPixCenter = newVal - CANVAS.getOffsetLeft() ; } ;

  var yPixCenter ;
  // var getYPixCenter = function() { return yPixCenter ; } ;
  var setYPixCenter = function( newVal ) { yPixCenter = newVal - CANVAS.getOffsetTop() ; } ;

  var xRotBoundOffset = 0 ;
  var getXRotBoundOffset = function() { return xRotBoundOffset ; } ;

  var yRotBoundOffset = 0 ;
  var getYRotBoundOffset = function() { return yRotBoundOffset ; } ;

  var xRotBoundExtension = 0 ;
  // var getXRotBoundExtension = function() { return xRotBoundExtension ; } ;

  var yRotBoundExtension = 0 ;
  // var getYRotBoundExtension = function() { return yRotBoundExtension ; } ;

  var setRotBounds = function() {
    // Naive approach, but works fine
    if( OPT.isPolar() ) {
      var l = xPixWidth / 2 , h = yPixWidth / 2 ;
      var diag = Math.sqrt( l * l + h * h ) ;
      // var pinchCorrection = 10 ;
      var pinchCorrection = 0 ;
      xRotBoundOffset = yRotBoundOffset = Math.ceil( diag - ( l < h ? l : h ) ) + pinchCorrection ;
      xRotBoundExtension = 2 * xRotBoundOffset ;
      yRotBoundExtension = 2 * xRotBoundOffset ;
      // console.log( xRotBoundOffset , yRotBoundOffset , xRotBoundExtension , yRotBoundExtension ) ;
    } else {
      xRotBoundOffset = yRotBoundOffset = xRotBoundExtension = yRotBoundExtension = 0 ;
    }
  } ;

  var initHeight = function() {
    var idealX = yWidth * ( xPixWidth / yPixWidth ) ;
    xMin = -3/5 * idealX ; xMax = 2/5 * idealX ;
    updateCPlaneWidths() ;
  } ;

  var initWidth = function() {
    var idealY = xWidth * ( yPixWidth / xPixWidth ) ;
    yMin = - idealY / 2 ; yMax = idealY / 2 ;
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

  var toReZ , toImZ ;
  var setPToCArrays = function() {
    var i ;
    toReZ = new Float64Array( xPixWidth + xRotBoundExtension ) ;
    toImZ = new Float64Array( yPixWidth + yRotBoundExtension ) ;
    // TODO: improve total width detection
    for( i = 0 ; i < ( xPixWidth + xRotBoundExtension ) ; i++ ) { toReZ[i] = xMin + ( deltaX * ( i - xRotBoundOffset ) ) ; }
    for( i = 0 ; i < ( yPixWidth + yRotBoundExtension ) ; i++ ) { toImZ[i] = yMin + ( deltaY * ( i - yRotBoundOffset ) ) ; }
    return this;
  } ;

  var getToReZ = function() { return toReZ ; } ;
  var getToImZ = function() { return toImZ ; } ;

  // // TODO: Polar
  // var toPixMod , toPixPhi ;
  // var setPModPhiArrays = function() {
  //   var curPixel , offsetXCoord , offsetYCoord ;
  //   var yPixWidthRot = yPixWidth + yRotBoundExtension ;
  //   var xPixWidthRot = xPixWidth + xRotBoundExtension ;
  //   toPixMod = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
  //   toPixPhi = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
  //   for( var yCoord = yRotBoundOffset , offsetYCenter = yRotBoundOffset + Math.round( yPixWidth / 2 ) ; yCoord < yPixWidthRot ; yCoord++ ) {
  //     for( var xCoord = xRotBoundOffset , offsetXCenter = xRotBoundOffset + Math.round( xPixWidth / 2 ) ; xCoord < xPixWidthRot ; xCoord++ ) {
  //       offsetXCoord  = xCoord - offsetXCenter ;
  //       offsetYCoord  = yCoord - offsetYCenter ;
  //       curPixel      = xCoord + yCoord * xPixWidth ;
  //       toPixMod[ curPixel ] = 2 * Math.PI + Math.sqrt( offsetXCoord * offsetXCoord + offsetYCoord * offsetYCoord ) ;
  //       toPixPhi[ curPixel ] = 2 * Math.PI + Math.atan( offsetXCoord === 0 ? offsetYCoord / 0.0000001 : offsetYCoord / offsetXCoord ) ;
  //       toPixPhi[ curPixel ] += offsetXCoord < 0 ? Math.PI : 0 ;
  //       // TODO: special fx!
  //       //if( true ) {
  //       //if( toPixPhi[ curPixel ] > Math.PI / 1 )
  //       //toPixPhi[ curPixel ] = ( Math.round( 1000 * toPixPhi[ curPixel ] ) % ( Math.PI * 1000 / 1 ) ) / 1000 ;
  //       //}
  //     }
  //   }
  //   return this;
  // } ;

  var getTotalPixelNumber = function() {
    return toImZ.length * toReZ.length ;
  } ;
  
  var remapPolarClick = function() {
    // TODO: polar parameter update with click remap
    //var rotX = OPT.isPolar() ?
    //this.rotComplex( [ xPixCenter , yPixCenter ] , this.toRad( - OPT.getRot() ) ) :
    //[ xPixCenter , yPixCenter ] ;
    //setXPixCenter( ev.layerX ) ;
    //setYPixCenter( ev.layerY ) ;
    //xPixCenter = rotX[ 0 ] ;
    //yPixCenter = rotX[ 1 ] ;
  } ;

  var updateDrawParams = function( ev ) {
    updateOverallZoomFactor() ;
    setXPixCenter( ev.layerX ) ;
    setYPixCenter( ev.layerY ) ;
    if( OPT.isPolar() ) { remapPolarClick() ; }
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
    "getXPixWidth"        : getXPixWidth ,
    "setRotBounds"        : setRotBounds ,
    "getXRotBoundOffset"  : getXRotBoundOffset ,
    "getYRotBoundOffset"  : getYRotBoundOffset ,
    "getExtendedYPixWidth": getExtendedYPixWidth ,
    "getExtendedXPixWidth": getExtendedXPixWidth ,
  } ;

  return API ;
} () ) ; // END PLANE
