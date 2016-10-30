document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {
    ( function main() {
      FRAC_CTL.showThreads().init().listen() ;
      CONTROLS.init().listen() ;
    } () ) ;
  }
}
