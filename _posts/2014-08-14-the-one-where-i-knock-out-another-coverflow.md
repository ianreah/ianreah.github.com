---
title: "The One Where I Knock Out Another CoverFlow"
layout: post
date: 2014-08-14 13:24:00
---

<p style="text-align: center"><a href="http://knockoutjs.com/"><img src="/img/knockout.png" alt="KnockoutJS" /></a></p>

<p style="text-align: right"><em>...see what I did there? <a href="http://www.macmillandictionary.com/thesaurus/british/knock-out#knock-out_11">Knock Out</a> / <a href="http://knockoutjs.com/">Knockout</a>? Ah, never mind.</em></p>

> #### TL;DR
>
> I'm experimenting with a CoverFlow control for a Spotify App. I want it to work well even with a large collection of albums.
> This post describes the approach I'm taking.
>
> I'm implementing it using the MVVM pattern with the help of KnockoutJS, so I'm going to come back and write up some of that
> later in [another post](http://ianreah.com/2014/12/21/a-coverflow-control-implemented-with-knockoutjs.html).

I've made a few CoverFlow controls already - I'm worried it's becoming an obsession!

The first was my Spotify App, [Spotify-LibBrowser](http://ianreah.com/Spotify-LibBrowser/). The Spotify App environment doesn't
support CSS3 3D transforms so I wasn't able to give it the familiar [three-dimensional CoverFlow formation](http://en.wikipedia.org/wiki/Cover_Flow).

I wanted to see how it could be done with CSS3 3D transforms so next I made [this control](http://ianreah.com/CoverFlow/). And then, just for fun,
I implemented [the same thing in Silverlight](http://ianreah.com/CoverFlow/silverlight.html)! (I even wrote a
[CodeProject article](http://www.codeproject.com/Articles/479137/A-Tale-of-Two-CoverFlows) about those last two.)

The trouble is... I'm not happy with any of them!

They all take [the same basic approach](http://www.codeproject.com/Articles/479137/A-Tale-of-Two-CoverFlows#implementation). The control contains
***all*** of the items laid out side-by-side. The whole control is moved horizontally (left or right) to keep the current item central. The items
are then scaled/rotated/hidden to give the desired CoverFlow formation. All of these movements are animated.

This works ok(-ish) for a relatively small number of items, but try to smoothly animate the above movements when the control contains hundreds
of items and is much wider than the display...well, that's a big ask! So I thought I'd have another go with a different approach...

>  ***Caveat:*** The main motivation for doing this is for my [Spotify App](http://ianreah.com/Spotify-LibBrowser/) as it currently has some major performance issues with large music libraries.
> It contains some WebKit specific stuff because that's the engine Spotify Apps use. It probably won't look right in non-WebKit browsers. Also,
> because the Spotify App environment doesn't support 3D transforms, I'm just using a flat layout - using scaling and opacity to give the impression of depth.
> It should be possible to add a few CSS3 transforms to get the three-dimensional formation mentioned earlier. 

#### The Basic Layout

With this approach the control will only ever contain 9 items, including a hidden one at each end (shown in red below). The reason for the hidden items should become clear soon.

<p style="text-align: center"><img src="/img/post-2014-04-30-basic layout.png" alt="the control has 9 items" /></p>

Moving to the next CoverFlow item consists of the following co-ordinated, animated actions:

* Slide the whole control one step to the left. (Where a step is equal to the distance between adjacent items.)
* Fade in the right-most (currently hidden) item. (Number 9 in the above diagram.)
* Fade out the second-from-left item. (Number 2 in the above diagram.)
* Reset the scale and opacity of the old current item. (Make number 5 look the same as the other items.)
* Increase the scale and opacity of the new current item. (Make number 6 look like number 5 used to look.)

The control will now look like this...

<p style="text-align: center"><img src="/img/post-2014-04-30-first-step.png" alt="half way through a move to next item" /></p>

At this point, with a magician's [sleight of hand](http://en.wikipedia.org/wiki/Sleight_of_hand), we turn off animations and:

* Remove the first item from the control
* Push a new item onto the end
* Move the whole control back to its initial position

By turning the animations off these last three things happen in the blink of an eye. The user shouldn't notice any change but the
control will now look like this...

<p style="text-align: center"><img src="/img/post-2014-04-30-end-of-move-next.png" alt="half way through a move to next item" /></p>

...which actually is exactly where we started except that the items have all moved one place to the left. We've also dropped one
item off the left and added a new one to the right. This means we're now ready to repeat the process if we wanted to move to the next
item again. (Or, move to the previous item using the same process but with the directions reversed.)

The advantage of this approach is that we can now have a CoverFlow with a potentially infinite number of items but the control only
ever has to deal with 9 of them at a time.

You can have a [play with it in action](http://ianreah.com/infinite-coverflow/). It might make it easier to follow what's going on.
(And remember - I'm aiming to get this into a Spotify App so some of the CSS is WebKit specific.) [The code is also available on GitHub](https://github.com/ianreah/infinite-coverflow).

Just like [my first Spotify App](http://ianreah.com/Spotify-LibBrowser/), I chose to follow the [Model-View-View Model (MVVM)](http://en.wikipedia.org/wiki/Model_View_ViewModel)
pattern with the help of [KnockoutJS](http://knockoutjs.com/index.html) - hence the ridiculous pun in the title. (Sorry!). I'm
going to focus on that aspect of the implementation in [another post](http://ianreah.com/2014/12/21/a-coverflow-control-implemented-with-knockoutjs.html).
