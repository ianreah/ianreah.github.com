---
layout: post
title: Augmented Reality with JavaScript, part two
date: 2013-08-11 12:41:00
---

[Last time](/2013/05/26/Augmented-Reality-with-JavaScript-Part-1.html), if you remember, I was playing around with some augmented reality. In particular, investigating what can be achieved without involving a lot of native, platform-specific coding (and all of the issues of divergent codebases that go along with that if we want our application to reach multiple platforms).

Naturally, the first port of call was the browser. I went through an approach combining [three.js](http://threejs.org/) and the [JSARToolkit](https://github.com/kig/JSARToolKit). Whilst I still maintain it's pretty amazing that you can do stuff like this in the browser, the desktop doesn't really provide for the augmented reality experience I was hoping for<a id="refNote1" href="#Note1"><sup>[1]</sup></a>. I didn't just want to see the augmented image reflected back to me on my monitor. I wanted to look onto the scene and experience the magic of seeing the augmentation appear in front of my very eyes (albeit, while looking through the camera lens of some mobile device)!

Surely *that's* going to require some native coding! Am I going to have to write the app in Java if I want it to run on Android devices, and then write it all again in Objective-C for Apple devices?

Well, [Wikitude](http://www.wikitude.com/) provide Android and iOS SDKs for building augmented reality applications. They also have a [PhoneGap](http://phonegap.com/) extension so, in theory, we could use this to write our application in HTML, CSS and JavaScript, then re-use the same code for each platform. You do need to have a development environment set up for each platform in order to build it though<a id="refNote2" href="#Note2"><sup>[2]</sup></a>.

In the rest of this post, I'll go through how I created [AR Molecule](https://github.com/ianreah/AR_Molecule), an Android app that uses PhoneGap and the Wikitude SDK to provide augmented reality with our [3D caffeine molecule](http://molecules3d.apphb.com/).

Here's just a short (poor quality) video to give some idea of what it looks like...

<div style="text-align: center"><iframe width="560" height="315" src="http://www.youtube.com/embed/T06B_uyfRp0" frameborder="0"> </iframe></div>

I haven't tested it, but all of the code here should be equally as applicable to an iOS app using the iOS version of the SDK.

#### Setting up the project

You need to [make a developer's account at Wikitude](http://developer.wikitude.com/login) to download and use the SDK. It's free to register and you get a fully functional version which is free to use for trial purposes. You need to purchase a license to remove the "Trial" watermark and distribute the app, but that's not necessary for this demonstration.

Follow these steps to set up the project:

1. Download the [PhoneGap plugin extension](http://developer.wikitude.com/download)
2. [Set up a PhoneGap Android project](http://docs.phonegap.com/en/2.9.0/guide_getting-started_android_index.md.html#Android%20Platform%20Guide)<a id="refNote3" href="#Note3"><sup>[3]</sup></a>
3. Follow the [setup guide here](http://www.wikitude.com/external/doc/documentation/3.0/phonegap/setupguidephonegapandroid.html#setup-guide-phonegap-plugin-for-android) to add the Wikitude SDK to your project
4. Set `<uses-sdk android:minSdkVersion="8"/>` or higher in `AndroidManifest.xml`
5. Add the [permissions listed here](http://www.wikitude.com/external/doc/documentation/3.0/android/setupguideandroid.html) to your `AndroidManifest.xml`

Now, to make sure that's all set up correctly, try building and running the project, (ideally [on a hardware device](http://developer.android.com/tools/device.html) rather than an emulator because you're going to need to be able to do that to test the augmented reality features later). You should see the default PhoneGap start screen...

<p style="text-align: center"><img src="/img/post-2013-07-31-blank-cordova.png" alt="a blank PhoneGap project" /></p>

#### Entering the Augmented Reality world

With Wikitude an Augmented Reality world (ARchitectWorld) is a bit like a web page in that it is written in HTML and JavaScript, but that's where the similarity ends. Any HTML content is displayed on top of the device's camera view and it can call methods in Wikitude's [AR module](http://www.wikitude.com/external/doc/documentation/3.0/Reference/JavaScript%20Reference/index.html) to render augmented reality content. It also makes use of compass and accelerometer values.

To turn a standard web page into an ARchitectWorld you only have to include `architect://architect.js`. So, add  a new file, `theWorld.html`, to the `assets/www` folder in the project you just created and give it the following HTML...

{% highlight html %}
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Hello Wikitude</title>
  </head>
  <body>
    <script src="architect://architect.js"></script>
  </body>
</html>
{% endhighlight %}

...then load the ARchitectWorld in your `deviceready` handler. There should already be a `deviceready` function in a file called `assets/www/js/index.js`. (This file and the code that's already in it was created when setting up the PhoneGap project in the previous section.) Add the following code to the `deviceready` function...

{% highlight javascript %}
// isDeviceSupported to check the device has the required hardware and software.
WikitudePlugin.isDeviceSupported(function() {
  // Success callback - load the ARchitectWorld with the path to your world's HTML file
  WikitudePlugin.loadARchitectWorld("assets/www/theWorld.html");
},

function() {
  // Error callback - the device isn't supported :-(
  navigator.notification.alert('Unable to launch the AR world on this device!');
});
{% endhighlight %}

So now, when you launch the app, you'll see an empty AR world. (Actually, you're seeing our `theWorld.html` web page displayed on top of the camera view.  You can prove that to yourself, if you want, by adding some text or any other HTML elements to the body of `theWorld.html` and you'll see them displayed over the camera view.)

Of course, an AR world without any augmentation looks a lot like the plain old boring real world so let's see what we can do about that...

#### Image recognition and some simple augmentation

Unlike JSARToolkit, Wikitude lets you create your own marker images. This opens up a lot of possibilities. Instead of having to use those [black and white block images](/img/marker.png) you could augment your business card, company logo, magazine advert, etc. Some images work better than others though. When you create the marker, Wikitude will give it a star rating (0-3) to give some indication of how suitable the image is for tracking. They also have some hints and tips on [this page](http://www.wikitude.com/external/doc/documentation/3.0/phonegap/targetmanagement.html) on what does and doesn't make a good marker image.

I tried (and failed) to be a bit creative and made this marker image...

<p style="text-align: center">
  <a href="https://github.com/ianreah/AR_Molecule/blob/master/target.jpg">
	<img src="/img/post-2013-08-02-wikitude-target.jpg" alt="The marker image" />
  </a>
</p>

(I got the [background image](http://freestock.ca/photomanipulations_g84-abstract_coffee_beans_texture_p2293.html) from [freestock.ca](http://freestock.ca/) under [a Creative Commons Attribution 3.0 Unported License](http://creativecommons.org/licenses/by/3.0/deed.en_US). The [image of the caffeine structure](https://en.wikipedia.org/wiki/File:Caffeine-2D-skeletal.svg) came from [Wikipedia](http://www.wikipedia.org/).)

To make your own image into a marker follow [these instructions](http://www.wikitude.com/external/doc/documentation/3.0/phonegap/targetmanagement.html) from Wikitude. Download your target collection (`.wtc` file) and add it to the `assets/www/res` folder in your project. (If you prefer, you can download [my wtc file](https://github.com/ianreah/AR_Molecule/blob/master/assets/www/res/caffeine.wtc) from the [github repository](https://github.com/ianreah/AR_Molecule).)

Now we'll try adding a simple text label overlay just to see how it works.

First, add a new JavaScript file to the project and include it in `theWorld.html`. (I put mine in the `assets/www/js` folder and called it `theWorld.js`)...

{% highlight html %}
<body>
  <script src="architect://architect.js"></script>
  <script src="js/theWorld.js"></script>
</body>
{% endhighlight %}

Then put this code in the new JavaScript file...

{% highlight javascript %}
// Construct the AR.Tracker with the path to your wtc file
var tracker = new AR.Tracker("res/caffeine.wtc");

// The second parameter is the height of the label in SDUs
// You can read about SDUs here...
// ...http://www.wikitude.com/external/doc/documentation/3.0/Reference/JavaScript%20Reference/module_AR.html
var overlay = new AR.Label("X", 1);

new AR.Trackable2DObject(tracker, "target", {drawables: {cam: overlay}});
{% endhighlight %}

...and see what happens when you run it on your device and point it at a print out of your marker.  Hopefully, you'll see something like this...

<p style="text-align: center"><img src="/img/post-2013-07-28-x-marks-the-spot.png" alt="image recognition with label overlay" /></p>

#### 3D

To incorporate 3D content into your AR world you need to convert it into Wikitude's own format. That's actually fairly straightforward to do with the [Wikitude 3D Encoder](http://www.wikitude.com/external/doc/documentation/3.0/phonegap/encoder.html). It just means we need to create the 3D content and convert it separately - we can't create it programmatically like we did with the threejs and JSARToolkit example.

The Wikitude 3D Encoder accepts models in FBX (`.fbx`) or Collada (`.dae`) file formats. I think most 3D modelling tools can export to at least one of these formats. There are also plenty of websites where you can download (sometimes for free) 3D models in either format.

I used [Blender](http://www.blender.org/) (a free and open source 3D creation software) to create a copy of my caffeine molecule<a id="refNote4" href="#Note4"><sup>[4]</sup></a>. Blender has exports for both FBX and Collada files.

It's then just a case of opening the `.fbx` or `.dae` file in the Wikitude 3D encoder and using the export button to save it to the Wikitude format (`.wt3`).

<p style="text-align: center">
  <img src="/img/post-2013-08-10-wikitude-3d-encoder.png" alt="The Wikitude 3D Encoder" />
</p>

I seemed to have more success with Collada dae files. From reading the [Wikitude forums](http://developer.wikitude.com/developer-forum/-/message_boards/message/230410?_19_redirect=http%3A%2F%2Fdeveloper.wikitude.com%2Fdeveloper-forum%2F-%2Fmessage_boards%2Fsearch%3F_19_keywords%3D3D%2Blighting%26_19_searchCategoryId%3D0%26_19_breadcrumbsCategoryId%3D0%26_19_redirect%3Dhttp%253A%252F%252Fdeveloper.wikitude.com%252Fdeveloper-forum%253Fp_p_id%253D19%2526p_p_lifecycle%253D0%2526p_p_state%253Dnormal%2526p_p_mode%253Dview%2526p_p_col_id%253Dcolumn-1%2526p_p_col_count%253D1%26_19_formDate%3D1376151324197) it sounds like it could be a bug in the way Blender exports the lighting information in FBX format.

Either way, the Wikitude 3D Encoder seems to do a good job of displaying the model as it will appear in your AR World, so if it doesn't look right here there's probably no point trying it on the device either.

To include the model in your AR World export from the Wikitude Encoder, add the exported `.wt3` file to the project, load it into an `AR.Model` object and pass this into the `AR.Trackable2DObject` instead of the label from the previous example. You can also scale the object, if necessary, to fit on to your marker better...

{% highlight javascript %}
var model = new AR.Model("res/caffeine.wt3", {
  scale: { x: 0.1, y: 0.1, z: 0.1 }
});

new AR.Trackable2DObject(tracker, "target", {drawables: {cam: model}});
{% endhighlight %}

#### Animation

The last thing I wanted to add in is some animation. Wikitude provides a [set of classes for animating](http://www.wikitude.com/external/doc/documentation/3.0/Reference/JavaScript%20Reference/Animation.html) any numeric property of any object.

There are limitations to using these with 3D models though. The animation will be applied on the complete loaded model scene. For example, if you use it to spin a model that's lit from one side then you'll see the dark side and light side as it rotates<a id="refNote5" href="#Note5"><sup>[5]</sup></a>.

Having said that, let's add a spinning animation to our model just to demonstrate how it can be done. I kind of get away with it with this model because it is lit from directly above - on the axis of the rotation.

First, we create an `AR.PropertyAnimation` passing it the object we want to animate and the name of the property to animate. The next three values specify the animation's start value, end value and duration in milliseconds. Finally, we specify a linear easing curve for a simple constant rotation.

When we start the animation with a call to the `start` function we can pass in the number of times we want the animation to loop, or, -1 indicates infinite looping.

{% highlight javascript %}
var spinAnimation = new AR.PropertyAnimation(model, "rotate.roll",
0, 360, 10000, {type: AR.CONST.EASING_CURVE_TYPE.LINEAR});

var tracker = new AR.Tracker("res/caffeine.wtc", {
  onLoaded : function() {
    spinAnimation.start(-1);
  }
});
{% endhighlight %}

And that's it. If you run it on your device now you should see the 3D spinning molecule appear whenever you point the device at the marker image.

The complete code is [available on GitHub](https://github.com/ianreah/AR_Molecule). Note that you will still need to register and download the Wikitude SDK to build it.

---

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note1" href="#refNote1">1.</a> ...and mobile browsers <del>don't yet</del> are only just <a href="http://blog.chromium.org/2013/07/chrome-29-beta-web-audio-and-webrtc-in.html">starting to support</a> the experimental features that my three.js/JSARToolkit implementation relies on.</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note2" href="#refNote2">2.</a> Although <a href="https://build.phonegap.com/">PhoneGap Build</a> now has <a href="http://phonegap.com/blog/2013/07/16/user-submitted-plugins-announcement-post/">support for user submitted plugins</a>, I'm not sure if Wikitude will be making their SDK available as part of that. My guess is that they'll want to keep access to the SDK through registration on their website only.</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note3" href="#refNote3">3.</a> <strong>HINT:</strong> Don't have spaces in the path to your source code directory. I learned the hard way that the <code>cordova</code> utility used for setting up the project doesn't like that.</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note4" href="#refNote4">4.</a> I also found a <a href="http://www.patrick-fuller.com/molecules-from-smiles-molfiles-in-blender/">nice tutorial</a> using Blender's Python API to create 3D molecules so I was able to use that to make something similar to my three.js model.</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note5" href="#refNote5">5.</a> The latest version of the SDK provides <a href="http://www.wikitude.com/external/doc/documentation/3.0/phonegap/assetsworkflow.html#working-with-3d-animations">support for handling models containing animations</a>, i.e., where the animation has been defined in the modelling software and exported in the FBX or Collada file. If you know how to create these animations in the modelling software then this is probably the better option.</p>