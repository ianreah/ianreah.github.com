var seconds = document.getElementById("seconds");
myLibrary.onSecondsUpdate(function (s) {
	seconds.innerHTML = s;
});
