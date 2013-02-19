---
layout: post
title: Real-time frequency analysis of streaming audio data
date: 2013-02-25 18:32:00
draft: true
---

<style>
#example {
    background-color: #212121;
    color: #F2F2F2;
    font-family: 'Myriad Pro', Calibri, Helvetica, Arial, sans-serif;
    font-size: small;
	height: 550px;
}

#example a {
    text-decoration: none;
    color: #007edf;
}

#example p {
    margin: 2px;
}

#example audio {
    width: 355px;
}

#example .showIfNoApi {
    display: none;
}

#example #visualisation {
    height: 255px;
    position: relative;
    margin: 10px;
    -webkit-box-reflect: below 3px -webkit-gradient(linear, left top, left bottom, from(transparent), to(rgba(255,255,255,0.2)));
}

#example #visualisation > div {
    width: 10px;
    background-color: darkorange;
    display: inline-block;
    position: absolute;
    bottom: 0px;
}
</style>

<div id="example">
	<audio id="player" class="hideIfNoApi" controls="controls" src="http://ianreah.blob.core.windows.net/sounds/Movement%20Proposition.mp3"> </audio>
	<p class="hideIfNoApi"><strong>Music: </strong><em>Movement Proposition,</em> Kevin MacLeod (<a href="http://incompetech.com/">incompetech.com</a>)</p>

	<div id="visualisation" class="hideIfNoApi"> </div>

	<p class="showIfNoApi">Unable to run this Web Audio API example. <a href="http://caniuse.com/#feat=audio-api">Check browser support</a></p>
	<img class="showIfNoApi" src="/images/post-2013-02-19-screenshot.png" />
</div>

<script type="text/javascript" src="/scripts/Real-time-frequency-analysis-of-streaming-audio-data/jquery-1.8.3.min.js"> </script>
<script type="text/javascript" src="/scripts/Real-time-frequency-analysis-of-streaming-audio-data/main.js"> </script>
