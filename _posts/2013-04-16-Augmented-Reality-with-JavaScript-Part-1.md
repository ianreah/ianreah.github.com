---
layout: post
title: Augmented Reality with JavaScript, part one
date: 2013-05-26 11:23:00
---

A colleague from marketing came back from a motor show recently with some [augmented reality](http://en.wikipedia.org/wiki/Augmented_reality) promotional material from one of the vendors. When they suggested that we make something similar for the conferences we attend I took it as a personal challenge!

You know the sort of thing - the company hands out fliers together with a link to a mobile app. The flier by itself looks quite plain and boring. But if you install the app on your phone or tablet and look at the flier through the device's camera, then it suddenly springs to life with 3D models and animations. Here's an example...

<div style="text-align: center"><iframe width="560" height="315" src="http://www.youtube.com/embed/Hv32V3EYauI" frameborder="0"> </iframe></div>

They can be very effective and engaging, but surely to implement something like this requires lots of platform specific SDKs and native coding, resulting in quite different codebases for the different types of devices you want to support? Well, it turns out that's not necessarily true...

In this post I'll go through a first attempt at doing some augmented reality in the browser (yes - you heard right...augmented reality *in the browser*) using [three.js](http://threejs.org/) and [JSARToolkit](https://github.com/kig/JSARToolKit). Then, in the [second part](http://ianreah.com/2013/08/11/Augmented-Reality-with-JavaScript-Part-2.html) I'll go through an alternative using [PhoneGap](http://phonegap.com/) with the [wikitude](http://www.wikitude.com/) plug-in to produce something more suited to mobile devices, (but still primarily using JavaScript and HTML).

#### A first attempt with JSARToolkit and three.js

I'd already been playing around with [three.js](http://threejs.org/) and used it to create some 3D chemical structures. I'm sure you recognise this caffeine molecule - you may even have it printed on your coffee mug...

<style>
#container {
	text-align: center;
}

#container > canvas {
	background: #050505;
}
</style>
<div id="container">
	<img class="nowebgl" src="/img/post-2013-04-17-caffeine.png" style="display:none">
	<p class="nowebgl" style="display:none; font-size: small; text-align: center; margin-top: 0">[Try viewing the page in a browser that <a href="http://caniuse.com/#search=webgl">can use WebGL</a> to see an animated, interactive render of the molecule.]<br />[<a href="https://github.com/ianreah/Molecules3D">View on GitHub</a>]</p>
</div>

...so this seemed like a reasonable candidate to try pairing up with some augmented reality.

[JSARToolkit](https://github.com/kig/JSARToolKit) is a JavaScript port of a [Flash port](http://www.libspark.org/wiki/saqoosha/FLARToolKit/en) of a [Java port](http://nyatla.jp/nyartoolkit/wp/) of an augmented reality library written in C called [ARToolkit](http://www.hitl.washington.edu/artoolkit/). (Did you follow that? ...never mind, it's not important!).

To use it you give it a `<canvas>` element containing an image. The toolkit analyses this image for known markers. It will then provide you with information about the markers it detected, including their [transform matrices](http://en.wikipedia.org/wiki/Transformation_matrix). You can see an example below. The image used as input to the toolkit is on the left and the results of its image analysis on the right.

![Example debug information from an JSARToolkit image analysis](/img/post-2013-04-17-debug.png)

> **TIP:** While working with the toolkit you can add a canvas to your page with `id="debugCanvas"` and define `DEBUG = true` in your JavaScript. The toolkit will then use this canvas to display debug information from its image analysis, as shown in the above right image.

You then use this information to 'augment' the original image...

1. Get the transform matrix from a detected marker and apply it to your three.js object
2. Draw the input image into your three.js scene
3. Overlay your transformed object

The main thing you need to know is how to convert the toolkit's matrices into something that three.js understands. There are two transforms you need to apply...

1. The three.js camera that you use for rendering the scene needs to have the same projection matrix as the detector, and,
2. The three.js object that you want to line up with a marker needs to have the same transform matrix as the marker.

I must confess that my understanding of 3D transform matrices is sketchy,<a id="refNote1" href="#Note1"><sup>[1]</sup></a> but I was able to use the demonstration [in this article](http://www.html5rocks.com/en/tutorials/webgl/jsartoolkit_webrtc/#toc-threejs) to make a couple of helper functions to convert the matrices to the appropriate three.js form.

Use this for setting the three.js camera projection matrix from the JSARToolkit's detector...

{% highlight javascript %}
THREE.Camera.prototype.setJsArMatrix = function (jsArParameters) {
  var matrixArray = new Float32Array(16);
  jsArParameters.copyCameraMatrix(matrixArray, 10, 10000);

  return this.projectionMatrix.set(
    matrixArray[0], matrixArray[4], matrixArray[8],  matrixArray[12],
    matrixArray[1], matrixArray[5], matrixArray[9],  matrixArray[13],
    matrixArray[2], matrixArray[6], matrixArray[10], matrixArray[14],
    matrixArray[3], matrixArray[7], matrixArray[11], matrixArray[15]
  );
};
{% endhighlight %}

Here's an example of how you use it...

{% highlight javascript %}
// The JSARToolkit detector...
var parameters = new FLARParam(width, height);
var detector = new FLARMultiIdMarkerDetector(parameters, markerWidth);

// The three.js camera for rendering the overlay on the input images
// (We need to give it the same projection matrix as the detector
// so the overlay will line up with what the detector is 'seeing')
var overlayCamera = new THREE.Camera();
overlayCamera.setJsArMatrix(parameters);
{% endhighlight %}

And, to set the three.js object transform matrix from a marker detected by the toolkit...

{% highlight javascript %}
THREE.Object3D.prototype.setJsArMatrix = function (jsArMatrix) {
  return this.matrix.set(
     jsArMatrix.m00,  jsArMatrix.m01, -jsArMatrix.m02,  jsArMatrix.m03,
    -jsArMatrix.m10, -jsArMatrix.m11,  jsArMatrix.m12, -jsArMatrix.m13,
     jsArMatrix.m20,  jsArMatrix.m21, -jsArMatrix.m22,  jsArMatrix.m23,
                  0,               0,               0,               1
  );
};
{% endhighlight %}

...with an example of its usage:

{% highlight javascript %}
// This JSARToolkit object reads image data from the canvas 'inputCapture'...
var imageReader = new NyARRgbRaster_Canvas2D(inputCapture);

// ...and we'll store matrix information about the detected markers here.
var resultMatrix = new NyARTransMatResult();

// Use the imageReader to detect the markers
// (The 2nd parameter is a threshold)
if (detector.detectMarkerLite(imageReader, 128) > 0) {
  // If any markers were detected, get the transform matrix of the first one
  detector.getTransformMatrix(0, resultMatrix);

  // and use it to transform our three.js object
  molecule.setJsArMatrix(resultMatrix);
  molecule.matrixWorldNeedsUpdate = true;
}

// Render the scene (input image first then overlay the transformed molecule)
...
{% endhighlight %}

Now, imagine putting that in an [animation loop](http://creativejs.com/resources/requestanimationframe/), and using the [WebRTC API](http://dev.w3.org/2011/webrtc/editor/webrtc.html) to update the `inputCapture` canvas on each frame from the user's webcam video stream, and you've pretty much got real-time streaming augmented reality!

You can see how I've put it all together in [this code here] (http://molecules3d.apphb.com/scripts/AR_mediastream.js) (or, view the [full project on GitHub](https://github.com/ianreah/Molecules3D)).

If you [can use WebGL](http://caniuse.com/#search=webgl) and [WebRTC](http://caniuse.com/#search=getusermedia) then you can print out this marker...

<p style="text-align: center"><a href="/img/marker.png"><img src="/img/marker.png" alt="The marker image" /></a></p>

...and [try it out](http://molecules3d.apphb.com/ar_mediastream.html).

Ok, so it is a bit rough and I've clearly still got some work to do but I still find it pretty impressive that you can even do anything like this in the browser! There is one obvious drawback with this approach though...It's all very well holding up a marker to your webcam and seeing the augmented image reflected back to you, but it's not really the same experience as looking at the scene 'through' your mobile device and seeing the augmentation appear on your 'line of sight'. Unfortunately, mobile browsers don't support the experimental features that this relies on...([yet?](http://gigaom.com/2013/05/17/webrtc-one-billion-endpoints/))

As I mentioned at the start of the post, [PhoneGap](http://phonegap.com/) with the [wikitude](http://www.wikitude.com/) plug-in provides an alternative more suited to mobile devices, (but still primarily using JavaScript and HTML). I'll go through some of that [next time](http://ianreah.com/2013/08/11/Augmented-Reality-with-JavaScript-Part-2.html). (I'm trying to get out of the habit of writing ridiculously long blog posts!) But, if you can't wait, the code for an Android version is [here on GitHub](https://github.com/ianreah/AR_Molecule).

---

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note1" href="#refNote1">1.</a> There's some good information in <a href="http://stackoverflow.com/questions/2465116/understanding-opengl-matrices/2465290#2465290">this stackoverflow answer</a>, but I think I'm going to have to read it a couple more times to get it to sink in!</p>

<script src="/js/Augmented-Reality-with-JavaScript/jquery.min.js"> </script>
<script src="/js/Augmented-Reality-with-JavaScript/three.min.js"> </script>
<script src="/js/Augmented-Reality-with-JavaScript/TrackballControls.js"> </script>
<script src="/js/Augmented-Reality-with-JavaScript/Detector.js"> </script>
<script src="/js/Augmented-Reality-with-JavaScript/jsFrames.min.js"> </script>
<script src="/js/Augmented-Reality-with-JavaScript/main.js"> </script>