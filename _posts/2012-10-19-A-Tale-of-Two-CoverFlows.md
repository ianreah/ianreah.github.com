---
layout: post
title: A Tale of Two Coverflows
date: 2012-10-19 20:21:00
---
I recently set myself the task of developing two versions of a simple [coverflow](http://en.wikipedia.org/wiki/Cover_Flow) control - one in Silverlight and one in JavaScript. The completion of the task provoked the following tweet...

<p style="text-align: center"><a href="https://twitter.com/ianreah/status/237255156423610368"><img src="/images/post-2012-09-02-tweet.png" alt="As a .NET developer, how come the Silverlight version seemed to take WAY more effort than the JavaScript version?" /></a></p>

...which surprised me because I have much more experience developing .NET applications than JavaScript.

In hindsight the tweet was probably a little unfair. The JavaScript version only works in WebKit browsers and I suspect it'll require quite a lot more effort in order to improve its browser coverage, whereas the Silverlight version should already work, as it is, in any browser provided there's an appropriate plug in available.  

It was still interesting to go back over and compare the two implementations, so I've written a [CodeProject article](http://www.codeproject.com/Articles/479137/A-Tale-of-Two-CoverFlows) which gives a high level overview of the two implementations and gives some thoughts as to what might have contributed to the above reaction...

<p><a href="http://www.codeproject.com/Articles/479137/A-Tale-of-Two-CoverFlows"><img src="/images/CodeProject.jpg" alt="The Code Project Article" style="float: left; margin-right: 20px;"/></a></p>

*"For an exercise of this nature, the static type checks and better tooling support available when developing the Silverlight version didn't seem to have as big an impact as they might on a larger more complex project. However, the streamlined feedback & debugging experience of the JavaScript development did make a big difference.*

*"Being able to change some JavaScript and simply refresh the browser to see the effect of the changes is a big advantage. Also, using the in-browser debugging tools to examine the state of elements and experiment with different values for their attributes while the UI updates 'on the fly' helped to quickly understand & solve many problems."*

Head over to Code Project if you want to [read the full article](http://www.codeproject.com/Articles/479137/A-Tale-of-Two-CoverFlows). Also, you can see the two coverflows in action here:

- [JavaScript version](http://ianreah.com/CoverFlow/javascript.html) (WebKit only)
- [Silverlight version](http://ianreah.com/CoverFlow/silverlight.html)

