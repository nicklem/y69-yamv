/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var ITER = ( function() {

  var mThreadData = [] ;
  var $mBrotWorkers = [] ;

  var getThreadData = function() { return mThreadData ; } ;
  var resetThreadData = function() { mThreadData = [] ; } ;

  var initCalc = function( size ) {
    mThreadData.push( new Uint8ClampedArray( size ) ) ;
  } ;

  //var initPolarCalc = function() {
    //calcRotBoundExtension() ;
    //populateViewportPolarArrays() ;
    //return this ;
  //} ;

  var execCalc = function() {
    //this.calcPrep() ;
    if( hasWorkers() && isMultiThreadRequested() ) {
      calcThreads() ;
      //} else {
      //UTIL.consoleLog( "Render" , UTIL.timeExec( this.singleThreadCalc , this ) ) ;
  }
  return this ;
  } ;

  var calcThreads = function() {
    var yPixWidth = PLANE.getYPixWidth() ;
    var numThreads = OPT.getNumThreads() ;
    var yPixWidthPerThread = Math.floor( yPixWidth / numThreads ) ;
    var lastThreadDelta = yPixWidth - yPixWidthPerThread * numThreads ;
    resetThreadData() ;
    for( var workerID = 0 ; workerID < numThreads  ; workerID++ ) {
      var yStart = workerID * yPixWidthPerThread , yEnd = yStart + yPixWidthPerThread ;
      // TODO: improve this correction
      //var isLastThread = workerID === ( numThreads - 1 ) ;
      //if( isLastThread ) { yEnd -= lastThreadDelta ; } ;
      startWorker( workerID , yStart , yEnd ) ;
    }
  } ;

  var redrawAndResetCount = function() {
    CANVAS.redraw() ;
    UTIL.consoleLog( "x" + PLANE.getOverallZoom().toPrecision( 3 ) , Math.round( performance.now() - window.$mBrotPerfStart ) + " ms" ) ;
    resetThreadDone() ;
  }

  var workerCallback = function( e ) {
    var workerID = e.data[ 0 ] ;
    var mandelData = e.data[ 1 ] ;
    mThreadData[ workerID ] = Uint8Array.from( mandelData ) ;
    incThreadDone() ;
    if( allThreadsDone() ) { redrawAndResetCount() }
  } ;

  var initWorker = function( workerID ) {
    $mBrotWorkers[ workerID ] = new Worker( "calc.js" ) ;
    $mBrotWorkers[ workerID ].onmessage = workerCallback ;
  } ;

  var workerUndefined = function( workerID ) { return typeof $mBrotWorkers[ workerID] === "undefined" ; }

  var startWorker = function( workerID , yStart , yEnd ) {
    if( workerUndefined( workerID ) ) { initWorker( workerID ) ; } 
    // TODO: improve performance timing
    // TODO: stop extra threads when lowering count
    window.$mBrotPerfStart = performance.now() ;
    $mBrotWorkers[ workerID ].postMessage( {
      "iterVal"    : OPT.getOptionData().iter.value ,
      "maxSq"      : OPT.getMaxSq() ,
      "toReZ"      : PLANE.getToReZ() ,
      "toImZ"      : PLANE.getToImZ( yStart , yEnd ) ,
      "workerID"   : workerID
    } ) ;
  } ;

  var threadsDone = 0 ;

  var hasWorkers = function() { return !! window.Worker ; } ;
  var isMultiThreadRequested = function() { return OPT.getOptionData().multiThread.value !== "One" } ;
  var maxThreads = function() { return !! navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1 ; } ;
  var incThreadDone = function() { threadsDone += 1 ; } ;
  var getThreadsDone = function() { return threadsDone ; } ;
  var allThreadsDone = function() { return threadsDone === OPT.getOptionData().multiThread.options[ OPT.getOptionData().multiThread.value ] ; } ;
  var resetThreadDone = function() { threadsDone = 0 ; } ;

  var API = {
    "hasWorkers"              : hasWorkers ,
    "isMultiThreadRequested"  : isMultiThreadRequested ,
    "maxThreads"              : maxThreads ,
    "initCalc"                : initCalc ,
    "execCalc"                : execCalc ,
    "getThreadData"           : getThreadData ,
    "resetThreadData"         : resetThreadData ,
  } ;

  return API ;
} () ) ; // END ITER

