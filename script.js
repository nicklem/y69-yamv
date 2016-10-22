/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

    var $mBrotOptions = ( function() {
      this.MAX      = 2 , // max mandelbrot value after which we conclude function diverges
      this.WHITE    = 255 ,
      this.ZOOM     = 1.5 ; // zoom factor upon click
      this.ITER     = 30  ;
      //this.AA    = false ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {

      // UTILITY VARS
      //
      var canvas = document.querySelector( "canvas" ) ;
      var ctx , pData ;

      // INIT PRIVATE VARS

      var zoom = 1 ;
      var maxSq = $mBrotOptions.MAX * $mBrotOptions.MAX ; // max mandelbrot value after which we conclude function diverges
      var xCenter = yCenter = 0 ;
      // TODO: remove magic constants. These are good starting values to envelop fractal
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
      var xCoordArr = [] ,
      yCoordArr = [] ;
      var xRes , yRes , xCanvasCenter , yCanvasCenter , screenRatio , windowWidth , windowHeight ;
        windowHeight = window.innerHeight || 300 ;

      // VIEW

      var colors = [] ;

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
        pData = ctx.getImageData( 0 , 0 , canvas.width , canvas.height ) ;

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
        for( var i = 1 ; i <= $mBrotOptions.ITER ; i ++ ) {
          z = this.complexSum( this.complexMult( z , z ) , c ) ;
          modZSq = this.modulusSquared( z ) ;
          if( modZSq > maxSq ) return colors[ i ] ;
        }
        return colors[ $mBrotOptions.ITER ] ;
      } ;

      //this.pixRender = function pixRender( pixRGB , xCanvasCoord , yCanvasCoord ) {
      //var pixOffset = ( xCanvasCoord + yCanvasCoord * windowWidth ) * 4 ;
      //pData.data[ pixOffset ] = pData.data[ pixOffset + 1 ] = pData.data[ pixOffset + 2 ] = pixRGB ; pData.data[ pixOffset + 3 ] = 255 ;
      //} ;


      this.updateColorArr = function() {
        colors = [] ;
        for( var col = $mBrotOptions.ITER ; col >= 0 ; col-- ) {
          colors.push( $mBrotOptions.WHITE / Math.exp( col / 10 ) ) ;
        }
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

        zoom *= $mBrotOptions.ZOOM ;
        maxSq = $mBrotOptions.MAX * $mBrotOptions.MAX ;
        console.log( maxSq ) ;
        $mBrotOptions.ITER += 2 ;

        if( ev ) {
          console.log( ev ) ;
          xCanvasCenter = ev.layerX - canvas.offsetLeft ;
          yCanvasCenter = ev.layerY - canvas.offsetTop ;
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
              var mRGB = 0 ;
              var z = [ 0 , 0 ] , modZSq = 0 , c = [ xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ] ;

              for( var i = 1 ; i <= $mBrotOptions.ITER ; i ++ ) {
                z = this.complexSum( this.complexMult( z , z ) , c ) ;
                modZSq = this.modulusSquared( z ) ;
                if( modZSq > maxSq ) {
                  mRGB = colors[ i ] ;
                  break;
                }
              }
              if( i > $mBrotOptions.ITER ) mRGB = colors[ $mBrotOptions.ITER ] ;

              pData.data[ pixOffset ] = pData.data[ pixOffset + 1 ] = pData.data[ pixOffset + 2 ] = mRGB ;
                //= this.mandelDot( xCoordArr[ xCoord ] , yCoordArr[ yCoord ] );
              pData.data[ pixOffset + 3 ] = 255 ;
              //this.pixRender( this.mandelDot( xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ) , xCoord , yCoord  ) ;
          }
        }

        //console.log( pData ) ;
        ctx.putImageData( pData, 0 , 0 ); 
      } ;

      this.render = function render() {
        this.updateColors().draw() ;
      } ;

      this.init = function init() {
        this.initCanvas() ;
        this.updateColorArr() ;
        this.draw() ;
        return this ;
      } ;

      this.listen = function listen() {
        var that = this ;
        canvas.addEventListener( 'click' , function( ev ) {
          $mBrotControls.mapControls().render() ;
          that.updateParams( ev ).render() ;
        } ) ;
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
          var n = document.createElement( "span" ) ;
          n.id = opt ;
          var txt = document.createTextNode( opt ) ;
          var i = document.createElement( "input" ) ;
          i.type = "text" ;
          i.name = opt ;
          i.value = $mBrotOptions[ opt ] ;
          i.size = 4 ;
          //n.innerHTML = "" ;
          n.appendChild( txt ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          n.appendChild( i ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          controls.push( n ) ;
        }
        return this ;
      } ;

      this.mapControls = function() {
          for( var opt in $mBrotOptions ) {
            if( form.hasOwnProperty( opt ) ) {
              $mBrotOptions[ opt ] = parseFloat( form.elements[ opt ].value ) ;
            }
          }
          return this ;
      } ;

      this.listen = function() {
        var that = this ;
        form.addEventListener( "submit" , function( ev ) {
          ev.preventDefault() ;
          that.mapControls() ;
          $mBrot.updateParams().render() ;
        } ) ;
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
