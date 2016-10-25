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
// image export
// mobile styles
// web worker multithread
// refactor
// verify redraw not properly recalculating bounds

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

    var $mBrotOptions = ( function() {
      var YES = 1 , NO = 0 ;
      this.max = {          // max mandelbrot value after which we conclude function diverges
        "value" : 2 ,
        "labelText" : "Max" ,
        "type"  : "text" ,
        "recalcNeeded": YES ,
      } ,
      this.iter =  {        // initial iter value
        "value" : 15 ,
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
      this.rotation = {
        "value" : 0 ,
        "labelText" : "Rotation" ,
        "type"  : "text" ,
        "recalcNeeded": YES ,
      } ,
      this.brightness = {        // overall brightness value
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

    var $mBrotUtil = ( function() {
      this.performanceExec = function( f , msg , ctx ) {
        ctx = ctx || this ;
        msg = msg || "Done in" ;
        var initDraw = performance.now();
        f.bind( ctx )() ;
        var endDraw = performance.now();
        var t = ( endDraw - initDraw ) ;
        var millisecondsOrSeconds = t > 1000 ? [ 1 , "&nbsp;&nbsp;s" ] : [ 1000 ,  "&nbsp;ms" ] ;
        var formattedDelta = Math.round( millisecondsOrSeconds[ 0 ] * t ) / 1000 ;
        this.consoleLog( msg , formattedDelta + millisecondsOrSeconds[ 1 ] );
      } ;

      this.consoleLog = function( msg , data ) {
        var renderContainer = document.querySelector( "#console" ) ;
        formattedMsg =  "<div class=\"console-msg\">" + msg + "</div>" ;
        formattedData = data ? "<div class=\"console-data\">" + data + "</div>" : "" ;
        renderContainer.innerHTML = renderContainer.innerHTML + formattedMsg + formattedData ;
      }

      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {
      // UTILITY VARS
      var canvas = document.querySelector( "canvas" ) ;
      var ctx , imgData ;
      // INIT PRIVATE VARS
      var zoom = 1 ;
      var maxSq = $mBrotOptions.max.value * $mBrotOptions.max.value ; // squared for efficiency
      var xCenter = yCenter = 0 ;
      // TODO: remove magic constants. These are good starting values to envelop fractal
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
       //TODO: restore previous init once polar works
      //var xMin = -2 , xMax = 2 , yMin = -2 , yMax = 2 ;
      var xWidth , yWidth ;
      var toReZPlane , toImZPlane ;
      var xPixWidth , yPixWidth , xCanvasCenter , yCanvasCenter , screenRatio , windowWidth , windowHeight ;
      //windowHeight = window.innerHeight || 300 ;
      // VIEW
      var intensityRGB = [] , colorRGB = [] ;
      var R = 0 , G = 1 , B = 2 ;
      var mandelIterationData , localPolarModData , localPolarPhiData , cosMemo , sinMemo ;

      // INIT
      this.initCanvas = function() {
        if( xPixWidth !== window.innerWidth || yPixWidth !== window.innerHeight ) {
          // TODO: fix proper redraw on switch from landscape to portrait
          // keepinginitial draw centered on 0,0 while testing rotation function
          var initHeight = function() { var idealX = ( yMax - yMin ) * ( xPixWidth / yPixWidth ) ; xMin = -3/5 * idealX ; xMax = 2/5 * idealX ; }
          //var initHeight = function() { var idealX = ( yMax - yMin ) * ( xPixWidth / yPixWidth ) ; xMin = - idealX / 2 ; xMax = idealX / 2 ; }
          var initWidth = function() { var idealY = ( yMax - yMin ) * ( yPixWidth / xPixWidth ) ; yMin = - idealY / 2 ; yMax = idealY / 2 ; }

          windowWidth = window.innerWidth || 300 ;
          windowHeight = window.innerHeight || 300 ;

          canvas.width = xPixWidth = windowWidth ;
          canvas.height = yPixWidth = windowHeight ;
          screenRatio = windowWidth / windowHeight ;
          mandelIterationData = new Uint8ClampedArray( xPixWidth * yPixWidth ) ;

          // TODO: move these to conditional init on rotation != 0
          const FULL_CIRCLE_DIVS = 360000 ;
          localPolarModData = new Float32Array( xPixWidth * yPixWidth ) ;
          localPolarPhiData = new Float32Array( xPixWidth * yPixWidth ) ;
          cosMemo           = new Float32Array( FULL_CIRCLE_DIVS ) ;
          sinMemo           = new Float32Array( FULL_CIRCLE_DIVS ) ;
          this.memoizeSinCos() ;
          // END

          ( windowWidth > windowHeight ? initHeight : initWidth )() ;

          //console.log( "xMinMax upon init: " , xMin , xMax ) ;
          //console.log( "yMinMax upon init: " , yMin , yMax ) ;

          $mBrotUtil.performanceExec( this.populateViewportPolarArrays , "Polar array" , this ) ;

          ctx = canvas.getContext( "2d" ) ;
          imgData = ctx.getImageData( 0 , 0 , canvas.width , canvas.height ) ;
        } ;

        return this ;
      } ;

      // UTILITY FUNCTIONS

      this.bezierInterpolateThree = function( P0 , P1 , P2 , t ) {
        return ( 1 - t ) * ( 1 - t ) * P0 +
          2 * (1 - t ) * t * P1 +
          t * t * P2 ;
      } ;

      this.bezierInterpolateFour = function( P0 , P1 , P2 , P3 , t ) {
        return ( 1 - t ) * ( 1 - t ) * ( 1 - t ) * P0 +
          3 * ( 1 - t ) * ( 1 - t ) * t * P1 +
          3 * ( 1 - t ) * t * t * P2 +
          t * t * t * P3 ;
      } ;

      this.memoizeSinCos = function memoizeSinCos() {
        var divsPerHalfPi = 90000 ;
        var halfPiOffsetX1 = divsPerHalfPi ;
        var halfPiOffsetX2 = 2 * divsPerHalfPi ;
        var halfPiOffsetX3 = 3 * divsPerHalfPi ;
        var step = Math.PI / divsPerHalfPi ;
        var curCos , curSin ;
        for( var i = 0 ; i < 90000 ; i++ ) {
          curCos = Math.cos( step * i ) ;
          curSin = Math.sin( step * i ) ;
          cosMemo[ i ]                  =   curCos ;
          sinMemo[ i ]                  =   curSin ;
          cosMemo[ i + halfPiOffsetX1 ] = - curSin ;
          sinMemo[ i + halfPiOffsetX1 ] =   curCos ;
          cosMemo[ i + halfPiOffsetX2 ] = - curCos ;
          sinMemo[ i + halfPiOffsetX2 ] = - curSin ;
          cosMemo[ i + halfPiOffsetX3 ] =   curSin ;
          sinMemo[ i + halfPiOffsetX3 ] = - curCos ;
        }
        //console.log( "cos array length: " + cosMemo.length ) ;
        //console.log( "cos array memory (MB): " + cosMemo.byteLength / 1048576 ) ;
        //console.log( "sin array length: " + sinMemo.length ) ;
        //console.log( "sin array memory (MB): " + sinMemo.byteLength / 1048576 ) ;
        return this ;
      } ;

      this.updateColorArr = function() {
        intensityRGB = [] ;
        colorRGB = [] ;
        var innerColor = colors[ $mBrotOptions.innerColor.value ] ;
        var rimColor   = colors[ $mBrotOptions.rimColor.value ] ;
        var haloColor  = colors[ $mBrotOptions.haloColor.value ] ;
        var outerColor = colors[ $mBrotOptions.outerColor.value ] ;
        for( var col = $mBrotOptions.iter.value ; col >= 0 ; col-- ) {
          var brightnessDecay = 1 / Math.exp( col * $mBrotOptions.haloDecay.value / 100 ) ;
          var bezierFactor = col / $mBrotOptions.iter.value ;
          var brightMulti = brightnessDecay * $mBrotOptions.brightness.value ;
          intensityRGB.push( brightnessDecay ) ;
          colorRGB.push( [
              this.bezierInterpolateFour( innerColor[ R ] , rimColor[ R ] , haloColor[R] , outerColor[ R ] , bezierFactor ) * brightMulti ,
              this.bezierInterpolateFour( innerColor[ G ] , rimColor[ G ] , haloColor[G] , outerColor[ G ] , bezierFactor ) * brightMulti ,
              this.bezierInterpolateFour( innerColor[ B ] , rimColor[ B ] , haloColor[B] , outerColor[ B ] , bezierFactor ) * brightMulti
          ] ) ;
        }
        return this ;
      } ;

      this.populateCoordArrays = function populateCoordArrays() {
        toReZPlane = [] ; toImZPlane = [] ;
        var deltaX = ( xMax - xMin ) / xPixWidth , deltaY = ( yMax - yMin ) / yPixWidth , i = 0 ;
        for( i = 0 ; i < xPixWidth ; i ++ ) { toReZPlane[i] = xMin + ( deltaX * i ) ; }
        for( i = 0 ; i < yPixWidth ; i ++ ) { toImZPlane[i] = yMin + ( deltaY * i ) ; }
        return this;
      } ;

      this.populateViewportPolarArrays = function populateViewportPolarArrays() {
        var curPixel , offsetXCoord , offsetYCoord ;
        for( var yCoord = 0 , offsetY = Math.floor( yPixWidth / 2 ) ; yCoord < yPixWidth ; yCoord ++ ) {
          for( var xCoord = 0 , offsetX = Math.floor( xPixWidth / 2 ) ; xCoord < xPixWidth ; xCoord ++ ) {
            offsetXCoord  = xCoord - offsetX ;
            offsetYCoord  = yCoord - offsetY ;
            curPixel      = xCoord + yCoord * windowWidth ;
            localPolarModData[ curPixel ] = Math.sqrt( offsetXCoord * offsetXCoord + offsetYCoord * offsetYCoord ) ;
            localPolarPhiData[ curPixel ] = Math.atan( offsetXCoord === 0 ? offsetYCoord / 0.0000001 : offsetYCoord / offsetXCoord ) ;
            localPolarPhiData[ curPixel ] += offsetXCoord < 0 ? Math.PI : 0 ;
          }
        }
        return this;
      } ;

      this.updateDrawParams = function updateDrawParams( ev ) {
        maxSq = $mBrotOptions.max.value * $mBrotOptions.max.value ;
        if( !! ev ) { // onClick update, as opposed to form submit update
          xWidth = xMax - xMin , yWidth = yMax - yMin ;
          // update iter count
          $mBrotOptions.iter.value += $mBrotOptions.deltaIter.value ;
          // update center
          xCanvasCenter = ev.layerX - canvas.offsetLeft ;
          yCanvasCenter = ev.layerY - canvas.offsetTop ;
          // remap center to complex plane
          xCenter = ( ( xCanvasCenter / xPixWidth ) * xWidth ) + xMin ;
          yCenter = ( ( yCanvasCenter / yPixWidth ) * yWidth ) + yMin ;
          xMin = xCenter - ( xWidth / ( 2 * $mBrotOptions.zoom.value ) ) ;
          xMax = xCenter + ( xWidth / ( 2 * $mBrotOptions.zoom.value ) ) ;
          yMin = yCenter - ( yWidth / ( 2 * $mBrotOptions.zoom.value ) )  ;
          yMax = yCenter + ( yWidth / ( 2 * $mBrotOptions.zoom.value ) ) ;
        }
        return this ; 
      } ;

      this.draw = function draw() {
        var lenY = toImZPlane.length , lenX = toReZPlane.length , xCoord , yCoord , curPixel , pixOffset ;
        //console.log( imgData.data.length ) ;
        //console.log( ( lenX * lenY ) * 4  );
        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {
            curPixel = xCoord + yCoord * windowWidth ;
            pixOffset = curPixel * 4 ;
            imgData.data[ pixOffset     ] = colorRGB[ mandelIterationData[ curPixel ] ][ R ] ;
            imgData.data[ pixOffset + 1 ] = colorRGB[ mandelIterationData[ curPixel ] ][ G ] ;
            imgData.data[ pixOffset + 2 ] = colorRGB[ mandelIterationData[ curPixel ] ][ B ] ;
            imgData.data[ pixOffset + 3 ] = 255 ; // alpha
          }
        }
        ctx.putImageData( imgData, 0 , 0 ); 
        return this ;
      } ;

      this.calc = function calc() {
        this.populateCoordArrays() ;
        var lenY = toImZPlane.length ;
        var lenX = toReZPlane.length ;
        var iter = 1 ;
        var yCoord , xCoord , curPixel , z , modZSq ;
        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {
            z = [ 0 , 0 ] ;
            curPixel = xCoord + lenX * yCoord ;
            for( iter = 1 ; iter <= $mBrotOptions.iter.value ; iter++ ) {
              z = [ z[ 0 ] * z[ 0 ] - z[ 1 ] * z[ 1 ] + toReZPlane[ xCoord ] , 2 * z[ 0 ] * z[ 1 ] + toImZPlane[ yCoord ] ] ;
              modZSq = z[ 0 ] * z[ 0 ] + z[ 1 ] * z[ 1 ] ;
              if( modZSq > maxSq ) { // iterations diverge
                mandelIterationData[ curPixel ] = iter ;
                break;
              }
            }
            if( iter > $mBrotOptions.iter.value ) { // iterations converge
              mandelIterationData[ curPixel ] = $mBrotOptions.iter.value ;
            }
          }
        }
        return this ;
      } ;

      this.rotComplex = function rotComplex( c , phi ) {
        var Re = 0 , Im = 1 ;
        var curPix = Math.floor( c[ Re ] + c[ Im ] * windowWidth ) ;
        //var curPix = c[ Re ] + c[ Im ] * windowWidth ;
        return  [ ( xPixWidth / 2 + Math.cos( localPolarPhiData[ curPix ] + phi ) * localPolarModData[ curPix ] ) ,
                  ( yPixWidth / 2 + Math.sin( localPolarPhiData[ curPix ] + phi ) * localPolarModData[ curPix ] ) ] ;
        //return c;
      } ;

      this.polarCalc = function polarCalc() {
        //var deltaAngle = Math.PI / 8  ; // constant offset for now
        var deltaAngle = - Math.PI * $mBrotOptions.rotation.value / 180 ; 
        this.populateCoordArrays() ;
        var lenY = toImZPlane.length ;
        var lenX = toReZPlane.length ;
        var iter = 1 ;
        var yCoord , xCoord , curPixel , z , modZSq , rotComplex , Re = 0 , Im = 1 ;
        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {
            z = [ 0 , 0 ] ;
            rotatedC = this.rotComplex( [ xCoord , yCoord ] , deltaAngle ) ;
            curPixel = xCoord + lenX * yCoord ;
            //debugger;
            var count = 0 ;
            for( iter = 1 ; iter <= $mBrotOptions.iter.value ; iter++ ) {
              z = [ z[ 0 ] * z[ 0 ] - z[ 1 ] * z[ 1 ] + toReZPlane[ Math.floor( rotatedC[ Re ] ) ] , 2 * z[ 0 ] * z[ 1 ] +  toImZPlane[ Math.floor( rotatedC[ Im ] ) ] ] ;
              modZSq = z[ 0 ] * z[ 0 ] + z[ 1 ] * z[ 1 ] ;
              if( modZSq > maxSq ) { // iterations diverge
                mandelIterationData[ curPixel ] = iter ;
                count += 1 ;
                break;
              }
            }
            if( iter > $mBrotOptions.iter.value ) { // iterations converge
              mandelIterationData[ curPixel ] = $mBrotOptions.iter.value ;
            }
          }
        }
        return this ;
      } ;

      this.render = function render() {
        $mBrotUtil.performanceExec( this.initCanvas , "Init" , this ) ;
        //$mBrotUtil.consoleLog( "Relative" , "(" + xPixWidth / 2 + "," + yPixWidth / 2 + "i)" ) ;
        //$mBrotUtil.performanceExec( this.calc , "Calc" , this ) ;
        $mBrotUtil.performanceExec( this.polarCalc , "Polar calc" , this ) ;
        //$mBrotUtil.consoleLog( "Render" , "(" + Math.round( 1000 * xCenter ) / 1000 + "," + Math.round( 1000 * yCenter ) / 1000 + "i)" ) ;
        //$mBrotUtil.consoleLog( "Delta per pixel" , "(" + Math.round( 10000 * xWidth / xPixWidth ) + "," + Math.round( 10000 * yWidth / yPixWidth ) + "i)" ) ;
        //$mBrotUtil.performanceExec( this.polarCalc , "Calc" , this ) ;
        this.redraw() ;
        return this ;
      } ;

      this.redraw = function redraw() {
        $mBrotUtil.performanceExec( function() {
          this.updateColorArr() ;
          this.draw() ;
        } , "Draw" , this ) ;
        // TODO: abstract console print
        $mBrotUtil.consoleLog( "Done" ) ;
        return this ;
      } ;

      this.listen = function listen() {
        canvas.addEventListener( "click" , function( ev ) {
          $mBrotControls.mapControls() ;
          this.updateDrawParams( ev ).render() ;
          $mBrotControls.createControls().render() ;
        }.bind( this ) ) ;
        return this ;
      } ;

      return this ;

    }.bind({}) () ) ;

    var $mBrotControls = ( function() {

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

        for( var opt in $mBrotOptions ) {

          switch( $mBrotOptions[ opt ].type ) {
            case( "text" ) :
              var inputElement = document.createElement( "input" ) ;
              inputElement.setAttribute( "type" , $mBrotOptions[ opt ].type ) ;
              inputElement.setAttribute( "value" , $mBrotOptions[ opt ].value ) ;
              inputElement.setAttribute( "name" , opt ) ;
              break ;
            case( "select" ) :
              var inputElement = document.createElement( "select" ) ;
              var options = $mBrotOptions[ opt ].options ;
              var curOption = $mBrotOptions[ opt ].value ;
              inputElement.setAttribute( "name" , opt ) ;
              for( var o in options ) {
                var curOpt = document.createElement( "option" ) ;
                curOpt.setAttribute( "value" , o ) ;
                if( o === curOption ) curOpt.setAttribute( "selected" , "" ) ;
                curOpt.innerHTML = o ;
                inputElement.appendChild( curOpt ) ;
              }
          }

          var container = document.createElement( "div" ) ;
          var label = document.createElement( "div" ) ;
          var txt = document.createTextNode( $mBrotOptions[ opt ].labelText ) ;

          container   .setAttribute( "id"    ,   opt                  ) ;
          label       .setAttribute( "class" ,  "control-input label" ) ;
          inputElement.setAttribute( "class" ,  "control-input field" ) ;

          container   .appendChild( inputElement  ) ;
          label       .appendChild( txt           ) ;
          container   .appendChild( label         ) ;

          controls    .push( container ) ;
        }
        return this ;
      } ;

      this.mapControls = function() {
        for( var opt in $mBrotOptions ) {
          if( form.hasOwnProperty( opt ) ) {
            var curOpt = form.elements[ opt ].value ;
            curOpt = isNaN( parseFloat( curOpt ) ) ? curOpt : parseFloat( curOpt ) ;
            if( $mBrotOptions[ opt ].value !== curOpt ) {
              recalcOnSubmit += $mBrotOptions[ opt ].recalcNeeded ;
              $mBrotOptions[ opt ].value = curOpt ;
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
            $mBrot.updateDrawParams().render() ;
          } else {
            $mBrot.redraw() ;
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

    // Let's Roll!
    $mBrot
      .render()
      .listen() ;
    $mBrotControls
      .init()
      .listen() ;

  }
}
