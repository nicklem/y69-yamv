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

  var getThreadData = function() { return mThreadData ; } ;
  var resetThreadData = function() { mThreadData = [] ; } ;

  var initCalc = function( size ) {
    mThreadData.push( new Uint8ClampedArray( size ) ) ;
  } ;

  var initPolarCalc = function() {
    //calcRotBoundExtension() ;
    //populateViewportPolarArrays() ;
    return this ;
  } ;

  var calcThreads = function() {
    var numThreads = OPT.getOptionData().multiThread.options[ OPT.getOptionData().multiThread.value ];
    var yPixWidthPerThread = Math.floor( yPixWidth / numThreads ) ;
    var lastThreadDelta = yPixWidth - yPixWidthPerThread * numThreads ;
    //console.log( ITER ) ;
    for( var workerID = 0 ; workerID < numThreads  ; workerID++ ) {
      var yStart = workerID * yPixWidthPerThread ;
      var yEnd  = yStart + yPixWidthPerThread ;
      initWorker( workerID , yStart , yEnd ) ;
    }
  } ;

  var initWorker = function( workerID , yStart , yEnd ) {
    if( typeof( $mBrotWorkers[ workerID] ) === "undefined" ) {
      $mBrotWorkers[ workerID ] = new Worker( "calc.js" ) ;
      $mBrotWorkers[ workerID ].onmessage = function( e ) { 
        mThreadData[ workerID ] = Uint8Array.from( e.data ) ;
        increaseDoneThreadCount() ;
        if( allThreadsDone() ) {
          CANVAS.redraw() ;
          UTIL.consoleLog( "Done" , Math.round( performance.now() - window.$mBrotPerfStart ) + " ms" ) ;
          resetThreadCount() ;
        } ;
      }.bind( this ) ;
    }
    // TODO: improve this
    window.$mBrotPerfStart = performance.now() ;
    $mBrotWorkers[ workerID ].postMessage( {
       "iterVal"    : OPT.getOptionData().iter.value ,
       "maxSq"      : OPT.getMaxSq() ,
       "toReZ"      : PLANE.getToReZ() ,
       "toImZ"      : PLANE.getToImZ( yStart , yEnd ) ,
       "workerID"   : workerID
    } ) ;
  } ;

  var threadCount = 0 ;
  var $mBrotWorkers = [] ;

  var hasWorkers = function() { return !! window.Worker ; } ;
  var isMultiThreadRequested = function() { return OPT.getOptionData().multiThread.value !== "One" } ;
  var maxThreads = function() { return !! navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1 ; } ;
  var increaseDoneThreadCount = function() { threadCount += 1 ; } ;
  var allThreadsDone = function() { return threadCount === OPT.getOptionData().multiThread.options[ OPT.getOptionData().multiThread.value ] ; } ;
  var resetThreadCount = function() { threadCount = 0 ; } ;

  var API = {
    "hasWorkers"              : hasWorkers ,
    "isMultiThreadRequested"  : isMultiThreadRequested ,
    "maxThreads"              : maxThreads ,
    "increaseDoneThreadCount" : increaseDoneThreadCount ,
    "allThreadsDone"          : allThreadsDone ,
    "resetThreadCount"        : resetThreadCount ,
    "calcThreads"             : calcThreads ,
    "initCalc"                : initCalc ,
    "initWorker"              : initWorker ,
    "getThreadData"           : getThreadData ,
    "resetThreadData"         : resetThreadData ,
  } ;

  return API ;
} () ) ; // END ITER

