(function (window, undefined) {
    var seconds = Rx.Observable.interval(1000);
	
	window.myLibrary = {
        onSecondsUpdate: function (action) {
            seconds.subscribe(action);
        }
	};
}(this));