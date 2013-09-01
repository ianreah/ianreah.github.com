---
layout: post
title: Real-time analysis of streaming audio data with Web Audio API
date: 2013-02-28 12:47:00
---

[Web Audio API](http://www.w3.org/TR/webaudio/) is a high-level JavaScript API for processing and synthesizing audio in web applications. The aim of the API is to enable [things like](http://www.w3.org/TR/webaudio/#ExampleApplications-section) dynamic sound effects in games, sound processing in music production applications, and real-time analysis in music visualisers.

[Music visualisers](http://en.wikipedia.org/wiki/Music_visualization) create and render animations synchronised to changes in the music's properties (frequency, loudness, etc). Most media players (such as Windows Media Player, or iTunes) have some sort of music visualiser feature...

![Music visualisers in Windows Media Player and iTunes](/img/post-2013-02-25-visualisers.jpg)

Creating this type of visualisation in the browser was only really practical by [pre-processing](http://gskinner.com/blog/archives/2011/03/music-visualizer-in-html5-js-with-source-code.html) the audio up-front and storing information separately to be accessed by the visualiser during playback. But that was before the Web Audio API and its real-time analysis capabilities...

The API is currently a working draft so things can change at any time. However, there is [partial support in Chrome](http://caniuse.com/#feat=audio-api) (as long as we use a `webkit` prefix),<a id="refNote1" href="#Note1"><sup>[1]</sup></a> which means we can start to have a play around and investigate its features. In this post we'll begin to investigate the real-time analysis capabilities of the API. (Obviously, there's a whole lot more to the API that we won't even touch on here!)

If you've got a [supported browser](http://caniuse.com/#feat=audio-api) you should be able to see it in action here with a very basic music visualizer that runs in the browser without the restriction of having to pre-process each piece of music in advance.

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

#example img {
	border: none;
	box-shadow: none;
	-webkit-box-shadow: none;
	-moz-box-shadow: none;
	-o-box-shadow: none;
	-ms-box-shadow: none;
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
	<audio id="player" class="hideIfNoApi" controls="controls" src="http://ianreah.apphb.com/sounds/movement%20proposition.mp3"> </audio>
	<p class="hideIfNoApi"><strong>Music: </strong><em>Movement Proposition,</em> Kevin MacLeod (<a href="http://incompetech.com/">incompetech.com</a>)</p>

	<div id="visualisation" class="hideIfNoApi"> </div>

	<p class="showIfNoApi">Unable to run this Web Audio API example. <a href="http://caniuse.com/#feat=audio-api">Check browser support</a></p>
	<img class="showIfNoApi" src="/img/post-2013-02-19-screenshot.png" />
</div>

The rest of this post will introduce some of the basic concepts of the Web Audio API and outline the implementation of the above animation. If you prefer, just [dive straight in to the source code here](/js/Real-time-frequency-analysis-of-streaming-audio-data/main.js).

#### Audio routing graphs

The API is based around the concept of audio routing graphs. At its simplest, an audio routing graph will consist of a single sound source (such as the audio data in an MP3 file) connected directly to a sound destination (such as your computer's speakers).

<p style="text-align: center"><img src="/img/post-2013-02-22-simple_routing.png" alt="Simple routing" /></p>

In general, the routing can contain any number of 'nodes' connected between one or more sound sources and ultimately connecting to the destination (what you get to hear). Audio data is passed in to each of the nodes, manipulated in some way and output to the next connection.

Using the API basically comes down to creating different types of nodes (some for controlling various properties of the audio, some for adding effects, etc, etc) and defining how the nodes should be connected together. As you can imagine, this can allow much more [complex and powerful routing](http://www.w3.org/TR/webaudio/#ModularRouting-section) than the simple connection shown above. The routing we'll be using to access the real-time analysis of the audio is very straightforward though, as you'll see later.

#### The AudioContext 

The [AudioContext](http://www.w3.org/TR/webaudio/#AudioContext-section) object is the main abstraction used for creating sound sources, creating the audio manipulation nodes, and defining the connections between them.

{% highlight javascript %}
var context = new webkitAudioContext();
  // (Remember the 'webkit' prefix we mentioned earlier?)
{% endhighlight %}

So, let's see how we could use this to create that simple source-to-destination routing we showed earlier.

First, we need the sound source. One way to create a sound source is to load the audio from an MP3 file into memory using an `XMLHttpRequest`. In the code below we've used the AudioContext's `createBufferSource` to create the source node. Then we use the context's `createBuffer` function to convert the ArrayBuffer response from the request into an AudioBuffer, and use that to set the source's `buffer` property...

{% highlight javascript %}
var request = new XMLHttpRequest();
request.open("GET", urlToMp3File, true);
request.responseType = "arraybuffer";

request.onload = function() {
    var source = context.createBufferSource();
    source.buffer = context.createBuffer(request.response, false);
}

request.send();
{% endhighlight %}

We don't have to create the destination node. The AudioContext has a `destination` property which represents the final destination to the audio hardware. We simply create the routing by connecting our source object to the AudioContext's destination.

{% highlight javascript %}
source.connect(context.destination);
{% endhighlight %}

<p style="text-align: center"><img src="/img/post-2013-02-22-simple_routing.png" alt="Simple routing" /></p>

#### A streaming sound source

The buffer approach described above is fine for short audio clips, but for longer sounds we wouldn't want to wait for the full data to be loaded into memory! It is, however, really easy to get streaming audio input as a sound source in an audio routing graph. To do this we use an [`<audio>`](https://developer.mozilla.org/en-US/docs/HTML/Element/audio) HTML element...

{% highlight html%}
<audio id="player" src="urlToMp3"></audio>
{% endhighlight %}

The `<audio>` element represents an audio stream. The AudioContext has a function, `createMediaElementSource`, which creates a sound source node that will re-route the element's audio playback and stream it through the routing graph...

{% highlight javascript %}
var audioElement = document.getElementById("player");
var source = context.createMediaElementSource(audioElement);
source.connect(context.destination);
{% endhighlight %}

One 'gotcha' that you may need to be aware of (depending on the status of [issue 112368](https://code.google.com/p/chromium/issues/detail?id=112368)), is that the source and its connection may need to be created *after* the audio element is ready to play...

{% highlight javascript %}
audioElement.addEventListener("canplay", function() {
    var source = context.createMediaElementSource(audioElement);
    source.connect(context.destination);
});
{% endhighlight %}

#### The AnalyserNode

So, now we have our streaming input coming into our routing graph and going straight to our audio hardware. But, how do we do the real-time analysis in order to make our music visualiser? Well I did say that the routing was really simple, so here it is...

<p style="text-align: center"><img src="/img/post-2013-02-22-routing_with_analyser_node.png" alt="Simple routing with analyser node" /></p>

The API provides a node that does it all for us - the [AnalyserNode](http://www.w3.org/TR/webaudio/#AnalyserNode). All we need to do is create an AnalyserNode and stick it in the routing graph between our source and destination. When the AnalyserNode is used in a routing graph, the audio data is passed un-processed from input to output, but we can use the node object to access the frequency-domain and time-domain analysis data in real-time.

As you'd expect, an AnalyserNode can be created using the `createAnalyser` function on the AudioContext object...

{% highlight javascript %}
var analyser = context.createAnalyser();
{% endhighlight %}

And, to create the routing graph we simply insert the analyser between our streaming audio source and the destination...

{% highlight javascript %}
audioElement.addEventListener("canplay", function() {
    var source = context.createMediaElementSource(audioElement);

    // Connect the output of the source to the input of the analyser
    source.connect(analyser);

    // Connect the output of the analyser to the destination
    analyser.connect(context.destination);
});
{% endhighlight %}

By default the analyser will give us frequency data with 1024 data points. We can change this by setting the `fftSize` property. The `fftSize` must be set to a power of two<a id="refNote2" href="#Note2"><sup>[2]</sup></a> and the number of data points in the resulting frequency analysis will always be `fftSize/2`. The `frequencyBinCount` property of the analyser will tell us the number of data points we're going to get in the frequency data.

{% highlight javascript %}
console.log(analyser.fftSize); // 2048 by default
console.log(analyser.frequencyBinCount); // will give us 1024 data points

analyser.fftSize = 64;
console.log(analyser.frequencyBinCount); // fftSize/2 = 32 data points
{% endhighlight %}

So, if we keep a byte array with `frequencyBinCount` elements, we can populate it with the frequency data at any time by passing it to the analyser's `getByteFrequencyData`<a id="refNote3" href="#Note3"><sup>[3]</sup></a> function...

{% highlight javascript %}
var frequencyData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(frequencyData);
{% endhighlight %}

#### Creating the animation

The best way to use this real-time data to create and render an animation is to refresh our `frequencyData` in a [requestAnimationFrame](http://creativejs.com/resources/requestanimationframe/) callback, and then use the new data to update the animation. `requestAnimationFrame` just schedules the function to be called again at *the next appropriate time for an animation frame*. It allows the browser to synchronize the animation updates with the redrawing of the screen (and possibly make some other optimisations based on CPU load, whether the page is currently in a background or foreground tab, etc).

{% highlight javascript %}
function update() {
    // Schedule the next update
    requestAnimationFrame(update);

    // Get the new frequency data
    analyser.getByteFrequencyData(frequencyData);

    // Update the visualisation
    bars.each(function (index, bar) {
        bar.style.height = frequencyData[index] + 'px';
    });
};

// Kick it off...
update();
{% endhighlight %}

Here we're simply using the frequency data to set the heights of some coloured 'bars'. (The 'bars' are `divs` laid out horizontally with a fixed width and a dark orange `background-colour`.) Of course, just displaying the frequency data in a bar graph is the simplest (and least entertaining!) music visualisation but with a bit more imagination and creativity it should be possible to use this approach to create some much [more interesting music visualisations](https://www.google.co.uk/search?q=audio+visualisation&hl=en&tbm=isch&tbo=u&source=univ&sa=X&ei=VygnUZaFOeOV0QXW04CYDQ&sqi=2&ved=0CEEQsAQ&biw=1366&bih=667#hl=en&tbm=isch&sa=1&q=audio+visualisation&oq=audio+visualisation&gs_l=img.3..0i24l5.27133.27354.4.27678.2.2.0.0.0.0.137.242.0j2.2.0.ernk_timediscountb..0.0...1.1.4.img.zJdbaHtAsvA&bav=on.2,or.r_gc.r_pw.r_cp.r_qf.&bvm=bv.42768644,d.d2k&fp=e57d5214f3d46558&biw=1366&bih=667).

Don't forget to [look through the final source code](/js/Real-time-frequency-analysis-of-streaming-audio-data/main.js) for our simple example.

---

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note1" href="#refNote1">1.</a> FireFox has an <a href="https://wiki.mozilla.org/Audio_Data_API">alternative API</a> which has been deprecated in favour of supporting the Web Audio API in the future.</p>
<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note2" href="#refNote2">2.</a> I think the power of 2 restriction just allows it to use a more efficient <a href="http://en.wikipedia.org/wiki/Fast_Fourier_transform">FFT</a> algorithm...but I've forgotten much of my signal processing studies now so don't quote me on that!</p>
<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note3" href="#refNote3">3.</a> There is also a <code>getByteTimeDomainData</code> function for getting the current time-domain (waveform) data but our simple animation only uses the frequency data.</p>

<script type="text/javascript" src="/js/Real-time-frequency-analysis-of-streaming-audio-data/jquery-1.8.3.min.js"> </script>
<script type="text/javascript" src="/js/Real-time-frequency-analysis-of-streaming-audio-data/main.js"> </script>