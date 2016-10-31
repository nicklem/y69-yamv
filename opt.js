/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var OPT = ( function() {

  var YES = 1 , NO = 0 ;

  var colors = {
    "White"    : [ 255 , 255 , 255 ] ,
    "Gray 1"   : [ 127 , 127 , 127 ] ,
    "Gray 2"   : [  63 ,  63 ,  63 ] ,
    "Gray 3"   : [  31 ,  31 ,  31 ] ,
    "Black"    : [   0 ,   0 ,   0 ] ,
    "Red"      : [ 255 ,   0 ,   0 ] ,
    "Green"    : [   0 , 255 ,   0 ] ,
    "Blue"     : [   0 ,   0 , 255 ] ,
    "Cyan"     : [   0 , 255 , 255 ] ,
    "Magenta"  : [ 255 ,   0 , 255 ] ,
    "Yellow"   : [ 255 , 255 ,   0 ] ,
  } ;

  var optionData = {

    max : { // max before algo can assume it diverges
      "value" : 2 ,
      "labelText" : "Max" ,
      "type"  : "text" ,
      "recalcNeeded": YES ,
    } ,

    "iter" :  {
      "value" : 25 ,
      "labelText" : "Iterations" ,
      "type"  : "text" ,
      "recalcNeeded": YES ,
    } ,

    "deltaIter" : {
      "value" : 0 ,
      "labelText" : "Delta iter" ,
      "type"  : "text" ,
      "recalcNeeded": NO ,
    } ,

    "zoom" : {
      "value" : 1 ,
      "labelText" : "Zoom factor" ,
      "type"  : "text" ,
      "recalcNeeded": NO ,
    } ,

    "renderEngine" : {
      "value" : "Polar" ,
      "labelText" : "Engine" ,
      "type"  : "select" ,
      "options": { "Cartesian" : "Cartesian" , "Polar" : "Polar" } ,
      "recalcNeeded": YES ,
    } ,

    "rot" : {
      "value" : 10 ,
      "labelText" : "Rotation" ,
      "type"  : "text" ,
      "recalcNeeded": YES ,
    } ,

    "multiThread" : {
      "value" : "Two" ,
      "labelText" : "Threads" ,
      "type"  : "select" ,
      "options": { "One" : 1 , "Two" : 2 , "Four" : 4 , "Eight" : 8 } ,
      "recalcNeeded": NO ,
    } ,

    "brightness" : {
      "value" : 1 ,
      "labelText" : "Brightness" ,
      "type"  : "text" ,
      "recalcNeeded": NO ,
    } ,

    "haloDecay" : {
      "value" : 7 ,
      "labelText" : "Halo decay" ,
      "type"  : "text" ,
      "recalcNeeded": NO ,
    } ,

    "innerColor" : {
      "value" : "White" ,
      "labelText" : "Inner color" ,
      "type"  : "select" ,
      "options": colors ,
      "recalcNeeded": NO ,
    } ,

    "rimColor" : {
      "value" : "Red" ,
      "labelText" : "Rim color" ,
      "type"  : "select" ,
      "options": colors ,
      "recalcNeeded": NO ,
    } ,

    "haloColor" : {
      "value" : "Blue" ,
      "labelText" : "Halo color" ,
      "type"  : "select" ,
      "options": colors ,
      "recalcNeeded": NO ,
    } ,

    "outerColor" : {
      "value" : "Black" ,
      "labelText" : "Outer color" ,
      "type"  : "select" ,
      "options": colors ,
      "recalcNeeded": NO ,
    } ,

  } ;

  var getOptionData = function() { return optionData ; } ;
  var setOption = function( opt , val ) { 
    if( typeof( optionData[ opt ].value ) !== "undefined") {
      optionData[ opt ].value =  val ; 
    } else throw new Error( "Setting non-existent option" ) ;
  } ;

  var getColors = function() {
    return colors ;
  } ;

  var getInnerColor = function() { return colors[ optionData.innerColor.value ] ; } ;
  var getRimColor   = function() { return colors[ optionData.rimColor.value ] ; } ;
  var getHaloColor  = function() { return colors[ optionData.haloColor.value ] ; } ;
  var getOuterColor = function() { return colors[ optionData.outerColor.value ] ; } ;

  var getMaxSq = function() { return optionData.max.value * optionData.max.value } ;
  var getZoom = function() { return optionData.zoom.value } ;
  var getRot = function() { return optionData.rot.value } ;
  var isPolar = function() { return optionData.renderEngine.value === "Polar" } ;
  var updateIterOnClick = function() { optionData.iter.value += optionData.deltaIter.value ; } ;
  var getNumThreads = function() { return optionData.multiThread.options[ optionData.multiThread.value ]; } ;

  return {
    "getOptionData"     : getOptionData ,
    "setOption"         : setOption ,
    "getColors"         : getColors ,
    "getMaxSq"          : getMaxSq ,
    "getZoom"           : getZoom ,
    "getNumThreads"     : getNumThreads ,
    "isPolar"           : isPolar ,
    "getRot"            : getRot ,
    "getInnerColor"     : getInnerColor ,
    "getRimColor"       : getRimColor ,
    "getHaloColor"      : getHaloColor ,
    "getOuterColor"     : getOuterColor ,
    "updateIterOnClick" : updateIterOnClick ,
  } ;

} () ) ; // END opt
