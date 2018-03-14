/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ************************
 */

var ITER = ( function() {

  var mThreadData = [] ;
  var getThreadData = function() { return mThreadData ; } ;
  // var flushThreadData = function() { mThreadData = [] ; } ;
  var resetThreadData = function() {
    mThreadData = [] ;
    if( isSingleThread() ) mThreadData.push( [] ) ;
  } ;

  var $mBrotWorkers = [] ;
  var setWorker = function( workerID ) {
    $mBrotWorkers[ workerID ] = new Worker( "threadcalc.js" ) ;
    $mBrotWorkers[ workerID ].onmessage = onWorkerDone ;
  } ;
  var onWorkerDone = function( e ) {
    var workerID = e.data[ 0 ] , threadData = e.data[ 1 ] ;
    mThreadData[ workerID ] = Uint8Array.from( threadData ) ;
    incThreadDone() ;
    if( allThreadsDone() ) { redrawAndReset() }
  } ;
  var isWorkerUndefined = function( workerID ) { return typeof $mBrotWorkers[ workerID] === "undefined" ; } ;

  var threadsDone = 0 ;
  var incThreadDone = function() { threadsDone += 1 ; } ;
  var allThreadsDone = function() { return threadsDone === OPT.getOptionData().multiThread.options[ OPT.getOptionData().multiThread.value ] ; } ;
  var resetThreadDone = function() { threadsDone = 0 ; } ;

  var initCalc = function() {
    resetThreadData() ;
    PLANE.setRotBounds() ;
    PLANE.setPToCArrays() ;
  } ;

  var execCalc = function() {
    execThreads() ;
    return this ;
  } ;

  var execThreads = function() {
    var yPixWidth = PLANE.getYPixWidth() ;
    var numThreads = OPT.getNumThreads() ;
    var yPixPerThread = Math.floor( yPixWidth / numThreads ) ;
    var yStart , yEnd , isLastThread ;
    for( var workerID = 0 ; workerID < numThreads  ; workerID++ ) {
      yStart = workerID * yPixPerThread ;
      yEnd = yStart + yPixPerThread ;
      startWorker( workerID , yStart , yEnd ) ;
    }
  } ;
 
  var startWorker = function( workerID , yStart , yEnd ) {
    if( isWorkerUndefined( workerID ) ) { setWorker( workerID ) ; }
    // TODO: improve performance timing
    // TODO: stop extra threads when lowering count
    startTimer() ;
    var xC = PLANE.getXPixWidth();
    var yC = PLANE.getYPixWidth() ;
    $mBrotWorkers[ workerID ].postMessage( {
      "iterVal"            : OPT.getOptionData().iter.value ,
      "maxSq"              : OPT.getMaxSq() ,
      "rotationAngle"      : MATH.toRad( OPT.getRot() ) ,
      "toReZ"              : PLANE.getToReZ() ,
      "toImZ"              : PLANE.getToImZ() ,
      "xRotBoundOffset"    : PLANE.getXRotBoundOffset() ,
      "yRotBoundOffset"    : PLANE.getYRotBoundOffset() ,
      "xOriginRotOffset"   : MATH.xRotOffset( xC/2 , yC/2 , MATH.toRad( OPT.getRot() ) ) ,
      "yOriginRotOffset"   : MATH.yRotOffset( xC/2 , yC/2 , MATH.toRad( OPT.getRot() ) ) ,
      "yStart"             : yStart ,
      "yEnd"               : yEnd ,
      "xWidth"             : xC ,
      "workerID"           : workerID ,
      "isPolar"            : OPT.isPolar() ,
    } ) ;
  } ;

  var redrawAndReset = function() {
    CANVAS.redraw() ;
    UTIL.consoleLog( OPT.getNumThreads() + "T/x" + PLANE.getOverallZoom().toPrecision( 3 ) , Math.round( performance.now() - window.$mBrotPerfStart ) + " ms" ) ;
    resetThreadDone() ;
  } ;

  var hasWorkers = function() { return !! window.Worker ; } ;
  var isMultiThread = function() { return OPT.getOptionData().multiThread.value !== "One" } ;
  var isSingleThread = function() { return OPT.getOptionData().multiThread.value === "One" } ;
  var maxThreads = function() { return !! navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1 ; } ;
  var startTimer = function() { window.$mBrotPerfStart = performance.now() ; } ;

  var API = {
    "hasWorkers"              : hasWorkers ,
    "isMultiThread"           : isMultiThread ,
    "maxThreads"              : maxThreads ,
    "initCalc"                : initCalc ,
    "execCalc"                : execCalc ,
    "getThreadData"           : getThreadData 
  } ;

  return API ;
} () ) ; // END ITER

