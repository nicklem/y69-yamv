/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

//  TODO:
//  1d display coord bounds and save coord history vector
//     + 1d don't re-calculate unless bounds change
// .5d image export
//  2d mobile styles
//  1d web worker multithread
//  ?d refactor

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

    var colors = {
      "white"    : [ 255 , 255 , 255 ] ,
      "gray 1"   : [ 127 , 127 , 127 ] ,
      "gray 2"   : [  63 ,  63 ,  63 ] ,
      "gray 3"   : [  31 ,  31 ,  31 ] ,
      "black"    : [   0 ,   0 ,   0 ] ,
      "red"      : [ 255 ,   0 ,   0 ] ,
      "green"    : [   0 , 255 ,   0 ] ,
      "blue"     : [   0 ,   0 , 255 ] ,
      "cyan"     : [   0 , 255 , 255 ] ,
      "magenta"  : [ 255 ,   0 , 255 ] ,
      "yellow"   : [ 255 , 255 ,   0 ] ,
    }

    var $mBrotOptions = ( function() {
      this.max = {          // max mandelbrot value after which we conclude function diverges
        "value" : 2 ,
        "label" : "Max" ,
        "type"  : "text" ,
        "recalc": 1 ,
      } ,
      this.brightness = {        // overall brightness value
        "value" : 1 ,
        "label" : "Brightness Multi" ,
        "type"  : "text" ,
        "recalc": 0 ,
      } ,
      this.zoom = {
        "value" : 3 ,
        "label" : "Zoom on click" ,
        "type"  : "text" ,
        "recalc": 0 ,
      } ,
      this.iter =  {        // initial iter value
        "value" : 25 ,
        "label" : "Iterations" ,
        "type"  : "text" ,
        "recalc": 1 ,
      } ,
      this.outBrightDecay = {
        "value" : 7 ,
        "label" : "Brightness decay" ,
        "type"  : "text" ,
        "recalc": 0 ,
      } ;
      this.innerColor = {
        "value" : "white" ,
        "label" : "Inner color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalc": 0 ,
      } ;
      this.rimColor = {
        "value" : "red" ,
        "label" : "Rim color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalc": 0 ,
      } ;
      this.haloColor = {
        "value" : "blue" ,
        "label" : "Halo color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalc": 0 ,
      } ;
      this.outerColor = {
        "value" : "black" ,
        "label" : "Outer color" ,
        "type"  : "select" ,
        "options": colors ,
        "recalc": 0 ,
      } ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrotUtil = ( function() {
      this.performanceExec = function( f , msg , ctx ) {
        ctx = ctx || this ;
        var initDraw = performance.now();
        f.bind(ctx)() ;
        var endDraw = performance.now();
        var t = ( endDraw - initDraw ) ;
        var millisecondsOrSeconds = t > 1000 ? [ 1 , "s" ] : [ 1000 , "ms" ] ;
        var formattedDelta = Math.round( millisecondsOrSeconds[ 0 ] * t ) / 1000 ;
        var renderContainer = document.querySelector( "#render" ) ;
        renderContainer.innerHTML = renderContainer.innerHTML + "<br>&gt;&nbsp;" + msg + "<br>" + formattedDelta + " " + millisecondsOrSeconds[ 1 ] + "." ;
      } ;
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
      var xCoordArr = [] ,
      yCoordArr = [] ;
      var xRes , yRes , xCanvasCenter , yCanvasCenter , screenRatio , windowWidth , windowHeight ;
          windowHeight = window.innerHeight || 300 ;

      // VIEW

      var intensityRGB = [] , colorRGB = [] ;
      var R = 0 , G = 1 , B = 2 ;
      var mandelItersPerPixel ;

      // INIT

      this.initCanvas = function() {
        var initHeight = function() { var idealX = ( yMax - yMin ) * ( xRes / yRes ) ; xMin = -3/5 * idealX ; xMax = 2/5 * idealX ; }
        var initWidth = function() { var idealY = ( yMax - yMin ) * ( yRes / xRes ) ; yMin = - idealY / 2 ; yMax = idealY / 2 ; }

        windowWidth = window.innerWidth || 300 ;
        windowHeight = window.innerHeight || 300 ;

        canvas.width = xRes = windowWidth ;
        canvas.height = yRes = windowHeight ;
        screenRatio = windowWidth / windowHeight ;

        ( windowWidth > windowHeight ? initHeight : initWidth )() ;

        ctx = canvas.getContext( "2d" ) ;
        imgData = ctx.getImageData( 0 , 0 , canvas.width , canvas.height ) ;

        return this ;
      } ;

      // UTILITY FUNCTIONS

      this.complexMult = function complexMult( c1 , c2 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] , c = c2[ 0 ] , d = c2[ 1 ] ;
        return [ ( a*c - b*d ) , ( a*d + b*c ) ] ;
      } ;

      this.complexSum = function complexSum( c1 , c2 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] , c = c2[ 0 ] , d = c2[ 1 ] ;
        return [ ( a + c ) , ( b + d ) ] ;
      } ;

      this.modulusSquared = function modulusSquared( c1 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] ;
        return a*a + b*b ;
      } ;

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

      this.updateColorArr = function() {
        intensityRGB = [] ;
        colorRGB = [] ;

        var innerColor = colors[ $mBrotOptions.innerColor.value ] ;
        var rimColor   = colors[ $mBrotOptions.rimColor.value ] ;
        var haloColor  = colors[ $mBrotOptions.haloColor.value ] ;
        var outerColor = colors[ $mBrotOptions.outerColor.value ] ;

        for( var col = $mBrotOptions.iter.value ; col >= 0 ; col-- ) {
          var brightnessDecay = 1 / Math.exp( col * $mBrotOptions.outBrightDecay.value / 100 ) ;
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
        var deltaX = ( xMax - xMin ) / xRes ,
        deltaY = ( yMax - yMin ) / yRes ;
        for( var i = 0 ; i <= xRes ; i ++ ) {
          xCoordArr[i] = xMin + ( deltaX * i ) ;
        }
        for( var i = 0 ; i <= yRes ; i ++ ) {
          yCoordArr[i] = yMin + ( deltaY * i ) ;
        }
        return this;
      } ;

      this.updateParams = function updateParams( ev ) {
        maxSq = $mBrotOptions.max.value * $mBrotOptions.max.value ;
        if( !! ev ) { // onClick update, as opposed to form submit update
          // update zoom factor
          zoom *= $mBrotOptions.zoom.value ;
          $mBrotOptions.iter.value += 2 ;
          // update center
          xCanvasCenter = ev.layerX - canvas.offsetLeft ;
          yCanvasCenter = ev.layerY - canvas.offsetTop ;
          // remap center to complex plane
          xCenter = ( ( xCanvasCenter / xRes ) * ( xMax - xMin ) ) + xMin ;
          yCenter = ( ( yCanvasCenter / yRes ) * ( yMax - yMin ) ) + yMin ;
          xMin = xCenter - screenRatio * ( 2 / zoom ) ;
          xMax = xCenter + screenRatio * ( 2 / zoom ) ;
          yMin = yCenter - ( 2 / zoom ) ;
          yMax = yCenter + ( 2 / zoom ) ;
        }
        return this ; 
      } ;

      this.draw = function draw() {
        var lenY = yCoordArr.length ;
        var lenX = xCoordArr.length ;
        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {
              var pixOffset = ( xCoord + yCoord * windowWidth ) * 4 ;
              imgData.data[ pixOffset ]     = colorRGB[ mandelItersPerPixel[ xCoord + ( lenX * yCoord )] ][ R ] ;
              imgData.data[ pixOffset + 1 ] = colorRGB[ mandelItersPerPixel[ xCoord + ( lenX * yCoord )] ][ G ] ;
              imgData.data[ pixOffset + 2 ] = colorRGB[ mandelItersPerPixel[ xCoord + ( lenX * yCoord )] ][ B ] ;
              imgData.data[ pixOffset + 3 ] = 255 ; // alpha
          }
        }
        ctx.putImageData( imgData, 0 , 0 ); 
        return this ;
      } ;

      this.calc = function calc() {
        this.populateCoordArrays() ;
        var yCoord = xCoord = 0 ;
        var lenY = yCoordArr.length ;
        var lenX = xCoordArr.length ;
        mandelItersPerPixel = [];

        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {

              var pixOffset = ( xCoord + yCoord * windowWidth ) * 4 ;
              var z = [ 0 , 0 ] , modZSq = 0 , c = [ xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ] ;

              for( var i = 1 ; i <= $mBrotOptions.iter.value ; i ++ ) {
                z = this.complexSum( this.complexMult( z , z ) , c ) ;
                modZSq = this.modulusSquared( z ) ;
                if( modZSq > maxSq ) {
                  mandelItersPerPixel[ xCoord + ( lenX * yCoord )] = i ;
                  break;
                }
              }

              if( i > $mBrotOptions.iter.value ) {
                mandelItersPerPixel[ xCoord + ( lenX * yCoord )] = $mBrotOptions.iter.value ;
              }
          }
        }

        return this ;
      } ;

      this.init = function init() {
        $mBrotUtil.performanceExec( this.initCanvas , "Initialize Canvas" , this ) ;
        this.render() ;
        return this ;
      } ;

      this.render = function render() {
        $mBrotUtil.performanceExec( this.calc , "Calculate" , this ) ;
        this.redraw() ;
        return this ;
      } ;

      this.redraw = function redraw() {
        console.log( this ) ;
        $mBrotUtil.performanceExec( this.updateColorArr , "Update color array" , this ) ;
        $mBrotUtil.performanceExec( this.draw , "Draw" , this ) ;
        return this ;
      } ;

      this.listen = function listen() {
        canvas.addEventListener( "click" , function( ev ) {
          $mBrotControls.mapControls() ;
          this.updateParams( ev ).render() ;
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
          var container = document.createElement( "span" ) ;
          container.id = opt ;
          var txt = document.createTextNode( $mBrotOptions[ opt ].label ) ;

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

          container.appendChild( txt ) ;
          container.appendChild( document.createElement( "br" ) ) ;
          container.appendChild( inputElement ) ;
          container.appendChild( document.createElement( "br" ) ) ;
          controls.push( container ) ;
        }
        return this ;
      } ;

      this.mapControls = function() {
          for( var opt in $mBrotOptions ) {
            //console.log( recalcOnSubmit ) ;
            if( form.hasOwnProperty( opt ) ) {
              var curOpt = form.elements[ opt ].value ;
              curOpt = isNaN( parseFloat( curOpt ) ) ? curOpt : parseFloat( curOpt ) ;
              if( $mBrotOptions[ opt ].value !== curOpt ) {
                recalcOnSubmit += $mBrotOptions[ opt ].recalc ;
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
          console.log( recalcOnSubmit ) ;
          if( recalcOnSubmit !== 0 ) {
            $mBrot.updateParams().render() ;
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
      .init()
      .listen() ;
    $mBrotControls
      .init()
      .listen() ;
  }
}
