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
//  OK - 1d color picker
//  1d display coord bounds and save coord history vector
//  1d don't re-calculate unless bounds change
// .5d image export
//  2d mobile styles
//     publish!
//  ?d refactor

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

    var colors = {
      "white"   : [ 255 , 255 , 255 ] ,
      "black"   : [   0 ,   0 ,   0 ] ,
      "red"     : [ 255 ,   0 ,   0 ] ,
      "green"   : [   0 , 255 ,   0 ] ,
      "blue"    : [   0 ,   0 , 255 ] ,
      "cyan"    : [   0 , 255 , 255 ] ,
      "magenta" : [ 255 ,   0 , 255 ] ,
      "yellow"  : [ 255 , 255 ,   0 ] ,
    }

    var $mBrotOptions = ( function() {
      this.max = {          // max mandelbrot value after which we conclude function diverges
        "value" : 2 ,
        "label" : "Max" ,
        "type"  : "text" ,
        //"min" : 0 ,
        //"max" : 2 ,
        //"step"  : 0.05 ,
      } ,
      this.brightness = {        // overall brightness value
        "value" : 1 ,
        "label" : "Brightness Multi" ,
        "type"  : "text" ,
        //"min" : 0 ,
        //"max" : 255 ,
        //"step"  : 10 ,
      } ,
      this.zoom = {
        "value" : 3 ,
        "label" : "Zoom on click" ,
        "type"  : "text" ,
        //"min" : 0.1 ,
        //"max" : 10 ,
        //"step"  : 0.1 ,
      } ,
      this.iter =  {        // initial iter value
        "value" : 25 ,
        "label" : "Iterations" ,
        "type"  : "text" ,
        //"min" : 0 ,
        //"max" : 150 ,
        //"step"  : 3 ,
      } ,
      this.outBright = {
        "value" : 10 ,
        "label" : "Outer brightness" ,
        "type"  : "text" ,
        //"min" : 0 ,
        //"max" : 100 ,
        //"step"  : 5 ,
      } ;
      this.innerColor = {
        "value" : "white" ,
        "label" : "Inner color" ,
        "type"  : "select" ,
        "options": colors ,
        //"min" : 0 ,
        //"max" : 100 ,
      } ;
      this.midColor = {
        "value" : "red" ,
        "label" : "Middle color" ,
        "type"  : "select" ,
        "options": colors ,
        //"min" : 0 ,
        //"max" : 100 ,
      } ;
      this.outerColor = {
        "value" : "black" ,
        "label" : "Outer color" ,
        "type"  : "select" ,
        "options": colors ,
        //"min" : 0 ,
        //"max" : 100 ,
      } ;
      //this.AA    = false ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrotUtil = ( function() {
      this.performanceExec = function( f , msg ) {
        var initDraw = performance.now();
        f() ;
        var endDraw = performance.now();
        var t = ( endDraw - initDraw ) ;
        var millisecondsOrSeconds = t > 1000 ? [ 1 , "s" ] : [ 1000 , "ms" ] ;
        var ms = Math.round( millisecondsOrSeconds[ 0 ] * t ) / 1000 ;
        console.log( msg + ": " + ms + " " + millisecondsOrSeconds[ 1 ] + ".") ;
      } ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {

      // UTILITY VARS
      //
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

      this.modulusSquared = function modulus( c1 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] ;
        return a*a + b*b ;
      } ;

      this.mandelDot = function mandelDot( x , y ) {
        var z = [ 0 , 0 ] , modZSq = 0 , c = [ x , y ] ;
        for( var i = 1 ; i <= $mBrotOptions.iter.value ; i ++ ) {
          z = this.complexSum( this.complexMult( z , z ) , c ) ;
          modZSq = this.modulusSquared( z ) ;
          if( modZSq > maxSq ) return intensityRGB[ i ] ;
        }
        return intensityRGB[ $mBrotOptions.iter.value ] ;
      } ;

      //this.pixRender = function pixRender( pixRGB , xCanvasCoord , yCanvasCoord ) {
      //var pixOffset = ( xCanvasCoord + yCanvasCoord * windowWidth ) * 4 ;
      //imgData.data[ pixOffset ] = imgData.data[ pixOffset + 1 ] = imgData.data[ pixOffset + 2 ] = pixRGB ; imgData.data[ pixOffset + 3 ] = 255 ;
      //} ;


      this.bezierInterpolate = function( P0 , P1 , P2 , t ) {
        return ( 1 - t ) * ( 1 - t ) * P0 + 2 * (1 - t ) * t * P1 + t * t * P2 ;
      } ;

      this.updateColorArr = function() {

        intensityRGB = [] ;
        colorRGB = [] ;

        var innerColor = colors[ $mBrotOptions.innerColor.value ] ;
        var midColor   = colors[ $mBrotOptions.midColor.value ] ;
        var outerColor = colors[ $mBrotOptions.outerColor.value ] ;

        for( var col = $mBrotOptions.iter.value ; col >= 0 ; col-- ) {
          var outerBrightnessFactor = 1 / Math.exp( col / $mBrotOptions.outBright.value ) ;
          var bezierFactor = col / $mBrotOptions.iter.value ;
          var brightMulti = outerBrightnessFactor * $mBrotOptions.brightness.value ;
          intensityRGB.push( outerBrightnessFactor ) ;
          colorRGB.push( [
              this.bezierInterpolate( innerColor[ R ] , midColor[ R ] , outerColor[ R ] , bezierFactor ) * brightMulti ,
              this.bezierInterpolate( innerColor[ G ] , midColor[ G ] , outerColor[ G ] , bezierFactor ) * brightMulti ,
              this.bezierInterpolate( innerColor[ B ] , midColor[ B ] , outerColor[ B ] , bezierFactor ) * brightMulti
          ] ) ;
        }
        //console.log( colorRGB ) ;
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

      this.updateColors = function updateColors() {
        this.updateColorArr() ;
        return this ;
      } ;

      this.updateParams = function updateParams( ev ) {

        maxSq = $mBrotOptions.max.value * $mBrotOptions.max.value ;
        $mBrotOptions.iter.value += 2 ;

        if( !! ev ) { // onClick update, as opposed to form submit update
          // update zoom factor
          zoom *= $mBrotOptions.zoom.value ;
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
        this.populateCoordArrays() ;
        var yCoord = xCoord = 0 ;
        var lenY = yCoordArr.length ;
        var lenX = xCoordArr.length ;

        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {

              var pixOffset = ( xCoord + yCoord * windowWidth ) * 4 ;
              var curIntensityRGB = 0 ;
              var curColorRGB = [] ;
              var z = [ 0 , 0 ] , modZSq = 0 , c = [ xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ] ;

              for( var i = 1 ; i <= $mBrotOptions.iter.value ; i ++ ) {
                z = this.complexSum( this.complexMult( z , z ) , c ) ;
                modZSq = this.modulusSquared( z ) ;
                if( modZSq > maxSq ) {
                  curIntensityRGB = intensityRGB[ i ] ;
                  curColorRGB = colorRGB[ i ] ;
                  break;
                }
              }
              if( i > $mBrotOptions.iter.value ) {
                curIntensityRGB = intensityRGB[ $mBrotOptions.iter.value ] ;
                curColorRGB = colorRGB[ $mBrotOptions.iter.value ] ;
              }

              imgData.data[ pixOffset ]     = curColorRGB[ R ] ;
              imgData.data[ pixOffset + 1 ] = curColorRGB[ G ] ;
              imgData.data[ pixOffset + 2 ] = curColorRGB[ B ] ;
              imgData.data[ pixOffset + 3 ] = 255 ; // alpha
          }
        }

        //console.log( imgData ) ;
        ctx.putImageData( imgData, 0 , 0 ); 
      } ;

      this.render = function render() {
        $mBrotUtil.performanceExec( function() {
          this.updateColors().draw() ;
        }.bind( this ) , "$mBrot.render()") ;
        return this ;
      } ;

      this.init = function init() {
        $mBrotUtil.performanceExec( function() {
          this.initCanvas().updateColorArr().draw() ;
        }.bind( this ) , "$mBrot.init()") ;
        return this ;
      } ;

      this.listen = function listen() {
        canvas.addEventListener( "click" , function( ev ) {
          $mBrotControls.mapControls() ;
          this.updateParams( ev ) ;
          this.render() ;
          $mBrotControls.render() ;
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

      // public
      this.init = function() {
        this.render() ;
        return this ;
      } ;

      this.createControls = function() {
        // TODO improve this
        controls = [] ;
        for( var opt in $mBrotOptions ) {
          // init container
          var container = document.createElement( "span" ) ;
          container.id = opt ;
          var txt = document.createTextNode( $mBrotOptions[ opt ].label ) ;
          // switch to create inputElement based on options format
          switch( $mBrotOptions[ opt ].type ) {
            case( "text" ) :
              var inputElement = document.createElement( "input" ) ;
              inputElement.setAttribute( "type" , $mBrotOptions[ opt ].type ) ;
              inputElement.name = opt ;
              inputElement.value = $mBrotOptions[ opt ].value ;
              break ;
            case( "select" ) :
              var options = $mBrotOptions[ opt ].options ;
              var curOption = $mBrotOptions[ opt ].value ;
              var inputElement = document.createElement( "select" ) ;
              inputElement.name = opt ;
              for( var o in options ) {
                var curOpt = document.createElement( "option" ) ;
                curOpt.setAttribute( "value" , o ) ;
                if( o === curOption ) curOpt.setAttribute( "selected" , "" ) ;
                curOpt.innerHTML = o ;
                inputElement.appendChild( curOpt ) ;
              }
          }
          // append label & formatted inner container
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
            if( form.hasOwnProperty( opt ) ) {
              // TODO: clean up input type detection
              var curOpt = form.elements[ opt ].value ;
              $mBrotOptions[ opt ].value = isNaN( parseFloat( curOpt ) ) ? curOpt : parseFloat( curOpt ) ;
            }
          }
          return this ;
      } ;

      this.listen = function() {
        form.addEventListener( "submit" , function( ev ) {
        //form.addEventListener( "mouseup" , function( ev ) {
          ev.preventDefault() ;
          this.mapControls() ;
          $mBrot.updateParams().render() ;
          //console.log( $mBrotOptions.brightness.value ) ;
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
