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
// REFACTOR FOR GODS SAKE
// display coord bounds and save coord history vector
// antialiasing
// web worker multithread
// image export
// mobile styles
// verify redraw on resize not properly recalculating bounds

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

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

    var $opt = ( function() {
      var YES = 1 , NO = 0 ;
      this.max = { // max before algo can assume it diverges
        "value" : 2 ,
        "labelText" : "Max" ,
        "type"  : "text" ,
        "recalcNeeded": YES ,
      } ,
      this.iter =  {
        "value" : 25 ,
        "labelText" : "Iterations" ,
        "type"  : "text" ,
        "recalcNeeded": YES ,
      } ,
      this.deltaIter = {
        "value" : 0 ,
        "labelText" : "Delta iter" ,
        "type"  : "text" ,
        "recalcNeeded": NO ,
      } ,
      this.zoom = {
        "value" : 1 ,
        "labelText" : "Zoom factor" ,
        "type"  : "text" ,
        "recalcNeeded": NO ,
      } ,
      this.renderEngine = {
        "value" : "Cartesian" ,
        "labelText" : "Engine" ,
        "type"  : "select" ,
        "options": { "Cartesian" : "Cartesian" , "Polar" : "Polar" } ,
        "recalcNeeded": YES ,
        "devStatus" : "beta" ,
      } ,
      this.rot = {
        "value" : 0 ,
        "labelText" : "Rotation" ,
        "type"  : "text" ,
        "recalcNeeded": YES ,
      } ,
      this.multiThread = {
        "value" : "One" ,
        "labelText" : "Cores" ,
        "type"  : "select" ,
        "options": { "One" : 1 , "Two" : 2 , "Four" : 4 , "Eight" : 8 } ,
        "recalcNeeded": NO ,
        "devStatus" : "alpha" ,
      } ,
      this.brightness = {
        "value" : 1 ,
        "labelText" : "Brightness" ,
        "type"  : "text" ,
        "recalcNeeded": NO ,
      } ,
      this.haloDecay = {
        "value" : 7 ,
        "labelText" : "Halo decay" ,
        "type"  : "text" ,
        "recalcNeeded": NO ,
      } ;
      this.innerColor = {
        "value" : "White" ,
        "labelText" : "Inner color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalcNeeded": NO ,
      } ;
      this.rimColor = {
        "value" : "Red" ,
        "labelText" : "Rim color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalcNeeded": NO ,
      } ;
      this.haloColor = {
        "value" : "Blue" ,
        "labelText" : "Halo color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalcNeeded": NO ,
      } ;
      this.outerColor = {
        "value" : "Black" ,
        "labelText" : "Outer color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalcNeeded": NO ,
      } ;
      return this ;
    }.bind( {} ) () ) ;

    var $util = ( function() {

      this.timeExec = function( f , context ) {
        const VALUE = 0 , UNIT = 1 ;
        var c = context || this ;
        var initTime = performance.now();
        f.bind( c )() ;
        var endTime = performance.now();
        var t = ( endTime - initTime ) ;
        var mSecOrSec = t > 1000 ? [ 1 , "&nbsp;&nbsp;s" ] : [ 1000 ,  "&nbsp;ms" ] ;
        var delta = Math.round( mSecOrSec[  VALUE ] * t ) / 1000 ;
        return delta + mSecOrSec[ UNIT ] ;
      } ;

      this.consoleLog = function( msg , data ) {
        var renderContainer = document.querySelector( "#console" ) ;
        formattedMsg =  "<div class=\"console-msg\">" + msg + "</div>" ;
        formattedData = data ? "<div class=\"console-data\">" + data + "</div>" : "" ;
        renderContainer.innerHTML = renderContainer.innerHTML + formattedMsg + formattedData ;
      } ;

      return this ;
    }.bind( {} ) () ) ;

    var $frac = ( function $frac() {

      // CANVAS
      var canvas = document.querySelector( "canvas" ) , ctx, imgData ;

      // FRACTAL ALGO VARS
      var zoom = 1 ;
      var maxSq = $opt.max.value * $opt.max.value ;
      var mandelIterData ;

      var getZoom = function() { return zoom ; }

      // TODO: remove magic constants. These are good starting values to envelop fractal

      // IMAGINARY PLANE VARS
      var xCenter , yCenter ;
      //TODO: restore previous init once polar works
      //var xMin = -2 , xMax = 2 , yMin = -2 , yMax = 2 ;
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;

      // CONVERSION VECTORS FROM COORDS TO COMPLEX
      var toReZ , toImZ ;

      // CONVERSION VECTORS FROM PIXELS TO COMPLEX - ROTATION
      var pixPolarMod , pixPolarPhi , rotCalc = 0 ;
      //var cosMemo , sinMemo ;
      var xRotBoundOffset = 0 , yRotBoundOffset = 0;
      var xRotBoundExtension = 0, yRotBoundExtension = 0;

      // VIEWPORT VARS
      var xPixWidth , yPixWidth ,
      xPixCenter , yPixCenter ;

      // COLORIZE VARS
      var colorRGB = [] ;
      var R = 0 , G = 1 , B = 2 ;

      // INIT
      this.initCanvas = function() {
        if( xPixWidth !== window.innerWidth || yPixWidth !== window.innerHeight ) {
          // TODO: fix proper redraw on switch from landscape to portrait
          var initHeight = function() {
            var idealX = ( yMax - yMin ) * ( xPixWidth / yPixWidth ) ;
            xMin = -3/5 * idealX ;
            xMax = 2/5 * idealX ;
          }
          var initWidth = function() {
            var idealY = ( yMax - yMin ) * ( yPixWidth / xPixWidth ) ;
            yMin = - idealY / 2 ; yMax = idealY / 2 ;
          }
          canvas.width  = xPixWidth = window.innerWidth || 300 ;
          canvas.height = yPixWidth = window.innerHeight || 300 ;
          ( xPixWidth > yPixWidth ? initHeight : initWidth )() ;
          ctx = canvas.getContext( "2d" ) ;
          imgData = ctx.getImageData( 0 , 0 , xPixWidth , yPixWidth ) ;
        } ;
        return this ;
      } ;

      this.hasWorkers = function() { return !! window.Worker ; } ;

      this.maxThreads = function() { return !! navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 1 ; } ;

      this.initCalc = function() {
        mandelIterData = new Uint8ClampedArray( ( xPixWidth + xRotBoundExtension ) * ( yPixWidth + yRotBoundExtension ) ) ;
        return this ;
      } ;

      this.initPolarCalc = function() {
        this.calcRotBoundExtension() ;
        this.populateViewportPolarArrays() ;
        return this ;
      } ;

      this.bezier4 = function( P0 , P1 , P2 , P3 , t ) {
        return ( 1 - t ) * ( 1 - t ) * ( 1 - t ) * P0 +
          3 * ( 1 - t ) * ( 1 - t ) * t * P1 +
          3 * ( 1 - t ) * t * t * P2 +
          t * t * t * P3 ;
      } ;

      this.toRad = function( deg ) {
        return ( Math.PI / 180 ) * deg ;
      } ;

      this.toDeg = function( rad ) {
        return ( 180 / Math.PI ) * rad ;
      } ;

      this.modulus = function( val ) {
        return val * Math.sign( val ) ;
      } ;

      //this.memoizeSinCos = function memoizeSinCos() {
      //var divsPerHalfPi = 900 ;
      //var halfPiOffsetX1 = divsPerHalfPi ;
      //var halfPiOffsetX2 = 2 * divsPerHalfPi ;
      //var halfPiOffsetX3 = 3 * divsPerHalfPi ;
      //var step = Math.PI / divsPerHalfPi ;
      //var curCos , curSin ;
      //for( var i = 0 ; i < divsPerHalfPi ; i++ ) {
      //curCos = Math.cos( step * i ) ;
      //curSin = Math.sin( step * i ) ;
      ////console.log( curCos, curSin) ;
      //cosMemo[ i ]                  =   curCos ;
      //cosMemo[ i + halfPiOffsetX1 ] = - curSin ;
      //cosMemo[ i + halfPiOffsetX2 ] = - curCos ;
      //cosMemo[ i + halfPiOffsetX3 ] =   curSin ;
      //sinMemo[ i ]                  =   curSin ;
      //sinMemo[ i + halfPiOffsetX1 ] =   curCos ;
      //sinMemo[ i + halfPiOffsetX2 ] = - curSin ;
      //sinMemo[ i + halfPiOffsetX3 ] = - curCos ;
      //}
      //return this ;
      //} ;

      this.updateColorLevelArr = function() {
        colorRGB = [] ;
        var innerColor = colors[ $opt.innerColor.value ] ;
        var rimColor   = colors[ $opt.rimColor.value ] ;
        var haloColor  = colors[ $opt.haloColor.value ] ;
        var outerColor = colors[ $opt.outerColor.value ] ;
        for( var col = $opt.iter.value ; col >= 0 ; col-- ) {
          var brightnessDecay = 1 / Math.exp( col * $opt.haloDecay.value / 100 ) ;
          var bezierFactor = col / $opt.iter.value ;
          var brightMulti = brightnessDecay * $opt.brightness.value ;
          colorRGB.push( [
              this.bezier4( innerColor[ R ] , rimColor[ R ] , haloColor[R] , outerColor[ R ] , bezierFactor ) * brightMulti ,
              this.bezier4( innerColor[ G ] , rimColor[ G ] , haloColor[G] , outerColor[ G ] , bezierFactor ) * brightMulti ,
              this.bezier4( innerColor[ B ] , rimColor[ B ] , haloColor[B] , outerColor[ B ] , bezierFactor ) * brightMulti
          ] ) ;
        }
        return this ;
      } ;

      this.populateCoordArrays = function populateCoordArrays() {
        toReZ = [] ; toImZ = [] ;
        var deltaX = ( xMax - xMin ) / xPixWidth ,
        deltaY = ( yMax - yMin ) / yPixWidth ;
        for( i = 0 ; i < ( xPixWidth + xRotBoundExtension ) ; i++ ) { toReZ[i] = xMin + ( deltaX * ( i - xRotBoundOffset ) ) ; }
        for( i = 0 ; i < ( yPixWidth + yRotBoundExtension ) ; i++ ) { toImZ[i] = yMin + ( deltaY * ( i - yRotBoundOffset ) ) ; }
        return this;
      } ;

      this.populateViewportPolarArrays = function populateViewportPolarArrays() {
        var curPixel , offsetXCoord , offsetYCoord ;
        var yPixWidthRot = yPixWidth + yRotBoundExtension ;
        var xPixWidthRot = xPixWidth + xRotBoundExtension ;
        pixPolarMod = [];
        pixPolarPhi = [];
        //pixPolarMod = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
        //pixPolarPhi = new Float32Array( xPixWidthRot * yPixWidthRot ) ;
        for( var yCoord = yRotBoundOffset , offsetYCenter = yRotBoundOffset + Math.round( yPixWidth / 2 ) ; yCoord < yPixWidthRot ; yCoord++ ) {
          for( var xCoord = xRotBoundOffset , offsetXCenter = xRotBoundOffset + Math.round( xPixWidth / 2 ) ; xCoord < xPixWidthRot ; xCoord++ ) {
            offsetXCoord  = xCoord - offsetXCenter ;
            offsetYCoord  = yCoord - offsetYCenter ;
            curPixel      = xCoord + yCoord * xPixWidth ;
            pixPolarMod[ curPixel ] = 2 * Math.PI + Math.sqrt( offsetXCoord * offsetXCoord + offsetYCoord * offsetYCoord ) ;
            pixPolarPhi[ curPixel ] = 2 * Math.PI + Math.atan( offsetXCoord === 0 ? offsetYCoord / 0.0000001 : offsetYCoord / offsetXCoord ) ;
            pixPolarPhi[ curPixel ] += offsetXCoord < 0 ? Math.PI : 0 ;
            // TODO: special fx!
            //if( true ) {
            //if( pixPolarPhi[ curPixel ] > Math.PI / 1 )
            //pixPolarPhi[ curPixel ] = ( Math.round( 1000 * pixPolarPhi[ curPixel ] ) % ( Math.PI * 1000 / 1 ) ) / 1000 ;
            //}
          }
        }
        //console.log( "[ polar array length , total pixels] : [" , pixPolarMod.length , "," , xPixWidth * yPixWidth , "]" ) ;
        return this;
      } ;

      this.rotComplex = function rotComplex( c , rot ) {
        var curPixRotOffset = ( c[ 0 ] + xRotBoundOffset ) + ( c[ 1 ] + yRotBoundOffset ) * xPixWidth ;
        var rotTransform = rot + pixPolarPhi[ curPixRotOffset ] ;
        return  [
          Math.floor( xPixWidth / 2 + Math.cos( rotTransform ) * pixPolarMod[ curPixRotOffset ] ) ,
          Math.floor( yPixWidth / 2 + Math.sin( rotTransform ) * pixPolarMod[ curPixRotOffset ] ) ,
        ];
      } ;

      this.updateDrawParams = function updateDrawParams( ev ) {
        maxSq = $opt.max.value * $opt.max.value ;
        if( !! ev ) { // onClick update, as opposed to form submit update
          var xWidth = xMax - xMin ;
          var yWidth = yMax - yMin ;
          // update iter count
          $opt.iter.value += $opt.deltaIter.value ;
          // update center
          xPixCenter = ev.layerX - canvas.offsetLeft ;
          yPixCenter = ev.layerY - canvas.offsetTop ;
          // remap click event if plane rotated
          var rotX = $opt.renderEngine.value === "Polar" ?
            this.rotComplex( [ xPixCenter , yPixCenter ] , this.toRad( -$opt.rot.value ) ) :
            [ xPixCenter , yPixCenter ] ;
          xPixCenter = rotX[ 0 ] ;
          yPixCenter = rotX[ 1 ] ;
          // update center to complex plane
          zoom *= $opt.zoom.value ;
          xCenter = xMin + ( xPixCenter / xPixWidth ) * xWidth ;
          yCenter = yMin + ( yPixCenter / yPixWidth ) * yWidth ;
          xMin = xCenter - ( xWidth / ( 2 * $opt.zoom.value ) ) ;
          xMax = xCenter + ( xWidth / ( 2 * $opt.zoom.value ) ) ;
          yMin = yCenter - ( yWidth / ( 2 * $opt.zoom.value ) ) ;
          yMax = yCenter + ( yWidth / ( 2 * $opt.zoom.value ) ) ;
        }
        return this ; 
      } ;

      this.calcRotBoundExtension = function() {
        if( $opt.renderEngine.value === "Polar" ) {
          var l = xPixWidth / 2 , h = yPixWidth / 2 ;
          var diag = Math.sqrt( l * l + h * h ) ;
          var pinchCorrection = 10 ;
          xRotBoundOffset = yRotBoundOffset = Math.ceil( diag - ( l < h ? l : h ) ) + pinchCorrection ;
          xRotBoundExtension = 2 * xRotBoundOffset ;
          yRotBoundExtension = 2 * xRotBoundOffset ;
          //console.log( "xRotBoundOffset , yRotBoundOffset , xRotBoundExtension , yRotBoundExtension" ) ;
          //console.log( xRotBoundOffset , yRotBoundOffset , xRotBoundExtension , yRotBoundExtension ) ;
        } else {
          xRotBoundOffset = yRotBoundOffset = xRotBoundExtension = yRotBoundExtension = 0 ; 
        }
        // TODO: can shave off % on extended rotation bounds calculation. Now it calcs the whole diagonal box
        //var phiH = Math.atan( h / l ) ;
        //var phiL = Math.atan( l / h ) ;
        //var rot = this.toRad( $opt.rot.value ) ;
        //rot = this.modulus( rot ) ;
        //var totH = this.modulus( diag * Math.sin( rot + phiH ) ) ;
        //var totL = this.modulus( diag * Math.sin( rot + phiL ) ) ;
        //var deltaPixHeigth = totH - h ;
        //var deltaPixWidth  = totL - l ;
        //console.log( deltaPixHeigth , deltaPixWidth ) ;
        //deltaPixHeigth = this.modulus( deltaPixHeigth ) ;
        //deltaPixWidth  = this.modulus( deltaPixWidth  ) ;
        //xRotBoundOffset = Math.round( deltaPixWidth + 1 );
        //yRotBoundOffset = Math.round( deltaPixHeigth + 1 );
      } ;

      this.draw = function draw( yStart , yEnd ) {
        var lenY = toImZ.length , lenX = toReZ.length ,
        xCoord , yCoord ,
        curPixel , curPixRotOffset , RGBAPixOffset ;
        try {
          for( yCoord = yStart ; yCoord < yEnd ; yCoord++ ) {
            for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {
              curPixRotOffset = ( xCoord + xRotBoundOffset ) + ( yCoord + yRotBoundOffset ) * xPixWidth ;
              curPixel = xCoord + yCoord * xPixWidth ;
              RGBAPixOffset = curPixel * 4 ;
              imgData.data[ RGBAPixOffset     ] = colorRGB[ mandelIterData[ curPixRotOffset ] ][ R ] ;
              imgData.data[ RGBAPixOffset + 1 ] = colorRGB[ mandelIterData[ curPixRotOffset ] ][ G ] ;
              imgData.data[ RGBAPixOffset + 2 ] = colorRGB[ mandelIterData[ curPixRotOffset ] ][ B ] ;
              imgData.data[ RGBAPixOffset + 3 ] = 255 ; // alpha
            }
          }
        } catch( e ) {
          console.log( "--- EXCEPTION ---" ) ;
          console.log( e.message ) ;
          console.log( "Reached coordinates (x,y) " , xCoord , yCoord )
          console.log( "--- END EXCEPTION ---" ) ;
        }
        //console.log( "drawing between: " , yStart , yEnd ) ;
        ctx.putImageData( imgData, 0 , 0 ); 
        return this ;
      } ;

      this.polarCalcPrep = function() {
        this.populateCoordArrays() ;
        if( $opt.renderEngine.value === "Polar" ) {
          rotCalc = $opt.rot.value ;
        }
      } ;


      // SINGLE THREAD CALC

      this.singleThreadCalc = function() {
        var angleUpdateRad = - Math.PI * $opt.rot.value / 180 ; 
        var iter = 1 , rotTransform ;
        var yCoord , xCoord , curPixel , z , zReSq , zImSq , c ;
        var Re = 0 , Im = 1 ;
        for( yCoord = 0 ; yCoord < toImZ.length ; yCoord++ ) {
          //for( yCoord = e.yInit ; yCoord < e.yEnd ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < toReZ.length ; xCoord++ ) {
            z = [ 0 , 0 ] ;
            curPixel = ( xCoord ) + xPixWidth * ( yCoord ) ;
            if( $opt.renderEngine.value === "Polar" ) {
              // Polar TODO: should memoize trig?
              rotTransform = angleUpdateRad + pixPolarPhi[ curPixel ] ;
              complexPixel= [
                Math.round( xPixWidth / 2 + Math.cos( rotTransform ) * pixPolarMod[ curPixel ] + xRotBoundOffset ) ,
                Math.round( yPixWidth / 2 + Math.sin( rotTransform ) * pixPolarMod[ curPixel ] + yRotBoundOffset ) ,
              ] ;
            } else {
              // Cartesian
              complexPixel = [ xCoord , yCoord ] ;
            }
            // MANDELBROT ALGO
            for( iter = 1 ; iter <= $opt.iter.value ; iter++ ) {
              zReSq = z[ Re ] * z[ Re ] , zImSq = z[ Im ] * z[ Im ] ;
              z = [ zReSq - zImSq + toReZ[ complexPixel[ Re ] ] , 2 * z[ Re ] * z[ Im ] + toImZ[ complexPixel[ Im ] ] ] ;
              if( zReSq + zImSq > maxSq ) { // iterations diverge
                mandelIterData[ curPixel ] = iter ;
                break ;
              }
            }
            if( iter > $opt.iter.value ) { // iterations converge
              mandelIterData[ curPixel ] = $opt.iter.value ;
            }
            // END MANDELBROT ALGO
          }
        }
        // TODO: THIS SHOULDN"T BE HERE
        this.redraw();
      } ;

        // MULTI THREAD WORKER FUNCTION

        this.workerCalc = function( e ) {
          var d = JSON.parse( e.data ) ;
          //var xStart          = d[ "xStart" ] ;
          var xPixWidth       = d[ "xPixWidth" ] ;
          //var xPixWidthRot    = d[ "xPixWidthRot" ] ;
          //var xRotBoundOffset = d[ "xRotBoundOffset" ] ;
          var yStart          = d[ "yStart" ] ;
          var yPixWidth       = d[ "yPixWidth" ] ;
          //var yPixWidthRot    = d[ "yPixWidthRot" ] ;
          //var yRotBoundOffset = d[ "yRotBoundOffset" ] ;
          var renderEngine    = d[ "renderEngine" ] ;
          var newAngle        = d[ "newAngle" ] ;
          var iterVal         = d[ "iterVal" ] ;
          var maxSq           = d[ "maxSq" ] ;
          var toReZ           = d[ "toReZ" ] ;
          var toImZ           = d[ "toImZ" ] ;
          //var pixPolarMod     = d[ "pixPolarMod" ] ;
          //var pixPolarPhi     = d[ "pixPolarPhi" ] ;
          //console.log( d ) ;
          //console.log( pixPolarMod.length ) ;
          //debugger;

          var mandelIterData = new Uint8ClampedArray( xPixWidth * yPixWidth ) ;
          var angleUpdateRad = - Math.PI * newAngle / 180 ; 
          var iter = 1 , rotTransform , pixPolarMod , pixPolarPhi ;
          var yCoord , xCoord , curPixel , z , zReSq , zImSq , c ;
          var Re = 0 , Im = 1 ;

          // THE LOOP
          for( yCoord = yStart ; yCoord < yPixWidth ; yCoord++ ) {
            //for( yCoord = e.yInit ; yCoord < e.yEnd ; yCoord++ ) {
            for( xCoord = 0 ; xCoord < xPixWidth ; xCoord++ ) {
          //for( var yCoord = yRotBoundOffset , offsetYCenter = yRotBoundOffset + Math.round( yPixWidth / 2 ) ; yCoord < yPixWidthRot ; yCoord++ ) {
            //for( var xCoord = xRotBoundOffset , offsetXCenter = xRotBoundOffset + Math.round( xPixWidth / 2 ) ; xCoord < xPixWidthRot ; xCoord++ ) {
              z = [ 0 , 0 ] ;
              curPixel = xCoord + xPixWidth * yCoord ;
              //if( renderEngine === "Polar" ) {
                //// Polar TODO: should memoize trig?
                //rotTransform = angleUpdateRad + pixPolarPhi[ curPixel ] ;
                //complexPixel= [
                  //Math.round( xPixWidth / 2 + Math.cos( rotTransform ) * pixPolarMod[ curPixel ] + xRotBoundOffset ) ,
                  //Math.round( yPixWidth / 2 + Math.sin( rotTransform ) * pixPolarMod[ curPixel ] + yRotBoundOffset ) ,
                //] ;
              //} else {
                // Cartesian
                complexPixel = [ xCoord , yCoord ] ;
              //}
              // MANDELBROT ALGO
              for( iter = 1 ; iter <= iterVal; iter++ ) {
                zReSq = z[ Re ] * z[ Re ] , zImSq = z[ Im ] * z[ Im ] ;
                z = [ zReSq - zImSq + toReZ[ complexPixel[ Re ] ] , 2 * z[ Re ] * z[ Im ] + toImZ[ complexPixel[ Im ] ] ] ;
                if( zReSq + zImSq > maxSq ) { // iterations diverge
                  mandelIterData[ curPixel ] = iter ;
                  break;
                }
              }
              if( iter > iterVal ) { // iterations converge
                mandelIterData[ curPixel ] = iterVal ;
              }
              // END MANDELBROT ALGO
            }
          }
          self.postMessage( mandelIterData ) ;
        }

        this.multiThreadCalc = function( yStart , yEnd ) {
          var workerFunc = "onmessage=" + this.workerCalc.toString() ;
          var workerBlob = new Blob( [ workerFunc ] ) ;
          var blobURL = window.URL.createObjectURL( workerBlob ) ;
          //var yPixWidthRot = yPixWidth + yRotBoundExtension ;
          //var xPixWidthRot = xPixWidth + xRotBoundExtension ;
          var data = {
            "xStart"          : 0 ,
            "xPixWidth"       : toReZ.length ,
            "yStart"          : yStart ,
            //"yStart"          : yStart ,
            "yPixWidth"       : yEnd ,
            //"newAngle"        : $opt.rot.value ,
            "renderEngine"    : $opt.renderEngine.value ,
            "iterVal"         : $opt.iter.value ,
            "toReZ"           : toReZ ,
            "toImZ"           : toImZ ,
            "maxSq"           : maxSq ,
            //"pixPolarMod"     : pixPolarMod.slice( toReZ.length * yStart , toReZ.length * yEnd ) ,
            //"pixPolarPhi"     : pixPolarPhi.slice( toReZ.length * yStart , toReZ.length * yEnd ) ,
            //"pixPolarMod"     : pixPolarMod.subarray( toReZ.length * yStart , toReZ.length * yEnd ) ,
            //"pixPolarPhi"     : pixPolarPhi.subarray( toReZ.length * yStart , toReZ.length * yEnd ) ,
            //"pixPolarMod"     : pixPolarMod ,
            //"pixPolarPhi"     : pixPolarPhi ,
            //"xRotBoundOffset" : xRotBoundOffset ,
            //"yRotBoundOffset" : yRotBoundOffset ,
            //"xPixWidthRot"    : xPixWidthRot ,
            //"yPixWidthRot"    : yPixWidthRot ,
          } ;
          //console.log( "Data before calling" ) ;
          console.log( data ) ;
          $mBrotWorkers.push( new Worker( blobURL ) ) ;
          var that = this ;
          $mBrotWorkers[ $mBrotWorkers.length - 1 ].onmessage = function( e ) { 
            mandelIterData = Uint8Array.from( e.data ) ;
            $util.consoleLog( "Core done" , Math.round( performance.now() - start ) + " ms" ) ;
            //console.log( "mandelIterData.length" , mandelIterData.length ) ;
            //console.log( "toReZ.length * toImZ.length" , toReZ.length * toImZ.length ) ;
            //console.log( "yStart , yEnd" , yStart , yEnd ) ;
            that.redraw( yStart , yEnd ) ;
          } ;
          var start = performance.now() ;
          $mBrotWorkers[ $mBrotWorkers.length - 1 ].postMessage( JSON.stringify( data ) ) ;
        } ;

        // Ye new & improved polar-enabled algo
        // Now with multithread!!

        this.polarCalc = function polarCalc() {
          window[ "$mBrotSharedData" ] = [ 1,2,3 ] ;
          this.polarCalcPrep() ;
          var threads = $opt.multiThread.options[ $opt.multiThread.value ];
          $util.consoleLog( "Threads" , threads ) ;
          //$util.consoleLog( "Worker support" , this.hasWorkers ? "Yes" : "No" ) ;
          if( this.hasWorkers() && $opt.multiThread.value !== "One" ) {
            var yThreadWidth = Math.ceil( yPixWidth / threads ) ;
            $util.consoleLog( "Multithread mode" ) ;
            window.$mBrotWorkers = [] ;
            for( var t = 0 ; t < threads  ; t++ ) {
            //for( var t = 0 ; t < 1  ; t++ ) {
              var yStart = t * yThreadWidth ;
              var yEnd  = yStart + yThreadWidth ;
              //var yStart = 100 ;        // TODO: ONE THREAD TEST
              //var yEnd  = 102 ; // TODO: ONE THREAD TEST
              this.multiThreadCalc( yStart , yEnd ) ;
            }
          } else {
            $util.consoleLog( "Done" , $util.timeExec( this.singleThreadCalc , this ) ) ;
          }
          return this ;
        } ;

        // API
        this.init = function() {
          $util.consoleLog( "Init" , $util.timeExec( function() {
            this.initCanvas() ;
            if( $opt.renderEngine.value === "Polar" ) {
              this.initPolarCalc() ;
            }
            this.initCalc() ;
          } , this ) ) ;
          this.render() ;
          return this ;
        } ;

        this.render = function render() {
          this.polarCalc() ;
          //$util.consoleLog( "Calc" , $util.timeExec( this.polarCalc , this ) ) ;
          //this.redraw() ;
          return this ;
        } ;

        this.redraw = function redraw( yStart , yEnd ) {
          yStart = yStart || 0 ;
          yEnd = yEnd || yPixWidth ;
          //$util.consoleLog( "Draw" , $util.timeExec( function() {
          this.updateColorLevelArr() ;
          this.draw( yStart , yEnd ) ;
          //} , this ) ) ;
          //$util.consoleLog( "ok" , "X" + getZoom() , $frac ) ;
          return this ;
        } ;

        this.listen = function listen() {
          canvas.addEventListener( "click" , function( ev ) {
            $ctrl.mapControls() ;
            this.updateDrawParams( ev ).render() ;
            $ctrl.createControls().render() ;
          }.bind( this ) ) ;
          return this ;
        } ;

        return this ;

        }.bind({}) () ) ;

        var $ctrl = ( function() {

          // private
          var form = document.querySelector( "#ctrl" ) ;
          var optionDisplay = document.querySelector( "#option-display" ) ;
          var controls = [] ;
          var recalcOnSubmit = false ;

          // public
          this.init = function() {
            this.render() ;
            return this ;
          } ;

          this.createControls = function() {
            controls = [] ;

            for( var opt in $opt ) {

              switch( $opt[ opt ].type ) {
                case( "text" ) :
                  var inputElement = document.createElement( "input" ) ;
                  inputElement.setAttribute( "type" , $opt[ opt ].type ) ;
                  inputElement.setAttribute( "value" , $opt[ opt ].value ) ;
                  inputElement.setAttribute( "name" , opt ) ;
                  break ;
                case( "select" ) :
                  var inputElement = document.createElement( "select" ) ;
                  var dropDownOpts = $opt[ opt ].options ;
                  var curOption = $opt[ opt ].value ;
                  inputElement.setAttribute( "name" , opt ) ;
                  for( var dropDownO in dropDownOpts ) {
                    var curOpt = document.createElement( "option" ) ;
                    curOpt.setAttribute( "value" , dropDownO ) ;
                    if( dropDownO === curOption ) curOpt.setAttribute( "selected" , "" ) ;
                    curOpt.innerHTML = dropDownO ;
                    inputElement.appendChild( curOpt ) ;
                  }
              }

              var container = document.createElement( "div" ) ;
              var label = document.createElement( "div" ) ;
              var txt = document.createTextNode( $opt[ opt ].labelText ) ;


              container   .setAttribute( "id"    ,   opt                  ) ;
              label       .setAttribute( "class" ,  "control-input label" ) ;
              inputElement.setAttribute( "class" ,  "control-input field" ) ;

              container   .appendChild( inputElement  ) ;
              label       .appendChild( txt           ) ;
              container   .appendChild( label         ) ;

              if( $opt[ opt ].devStatus ) {
                var devStatus = document.createElement( "div" ) ;
                var devStatusTxt = document.createTextNode( $opt[ opt ].devStatus ) ;
                devStatus.setAttribute( "class" , "control-input dev-status " + $opt[ opt ].devStatus ) ;
                devStatus.appendChild( devStatusTxt ) ;
                container .appendChild( devStatus ) ;
              }

              controls    .push( container ) ;
            }
            return this ;
          } ;

          this.mapControls = function() {
            for( var opt in $opt ) {
              if( form.hasOwnProperty( opt ) ) {
                var curOpt = form.elements[ opt ].value ;
                curOpt = isNaN( parseFloat( curOpt ) ) ? curOpt : parseFloat( curOpt ) ;
                if( $opt[ opt ].value !== curOpt ) {
                  recalcOnSubmit += $opt[ opt ].recalcNeeded ;
                  $opt[ opt ].value = curOpt ;
                }
              }
            }
            return this ;
          } ;

          this.listen = function() {
            form.addEventListener( "submit" , function( ev ) {
              ev.preventDefault() ;
              recalcOnSubmit = 0 ;
              this.mapControls() ;
              if( recalcOnSubmit !== 0 ) {
                $frac.updateDrawParams().init() ;
              } else {
                $frac.redraw() ;
              }
            }.bind( this ) ) ;
            return this ;
          } ;

          this.render = function() {
            //TODO improve this
            this.createControls() ;
            optionDisplay.innerHTML = "" ;
            controls.forEach( function( el ) {
              optionDisplay.appendChild( el ) ;
            } ) ; 
            return this;
          } ;

          return this ;

        }.bind({}) () ) ; 

        function main() {
          $frac.init().listen() ;
          $ctrl.init().listen() ;
        }

        // Let's Roll!
        main() ;
      }
    }
