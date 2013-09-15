---
layout: post
title: A Bootstrap Makeover - Fluid AND Responsive?
date: 2013-09-15 18:41:00
---

To celebrate my website's first birthday I decided to give it a bit of a makeover. I'm not exactly a prolific blogger but the previous design gave the impression that the site was all about the blog! And, a home page that just gives you the first screenful of the latest post? Well, that's not going to grab anyone's attention, is it?...

![The old site home page](/img/post-2013-09-13-old-site-home.png)

Instead, I wanted to give my coding projects more prominence and make the homepage a bit more interesting. Now, I'm not much of a designer but I hope that the new design is more eye-catching and gives my projects pride of place...

![The new site home page](/img/post-2013-09-13-new-site-home.png)

The redesign also gave me a chance to play around with [Twitter Bootstrap](http://getbootstrap.com/). In my (so far) limited experience, Twitter Bootstrap seems to be everything it claims to be - it enables quick and easy website development even for non-designer types like myself, it helps to produce something that works well on a range of devices, and it doesn't have much of a learning curve so it's very quick to [get started](http://getbootstrap.com/getting-started/).

<p class="wrapped-left"><a href="http://getbootstrap.com/"><img src="/img/twitter-bootstrap.jpg" alt="Twitter Bootstrap" /></a></p>

Having said that, though, one thing that wasn't immediately obvious to me when starting out with [Bootstrap v2.3.2](http://getbootstrap.com/2.3.2/) was the difference between [the fluid system](http://getbootstrap.com/2.3.2/scaffolding.html#fluidGridSystem) and [the responsive features](http://getbootstrap.com/2.3.2/scaffolding.html#responsive).

When would you want to use the fluid classes (`.row-fluid`, `.container-fluid`) over the responsive css? Would you ever want to use both?

Turns out it's actually really straight-forward...

**Fluid: ** The fluid classes are all about percentages. In Bootstrap v2.3.2, the `.container` class gets a fixed width. As do the `.span*`<a id="refNote1" href="#Note1"><sup>[1]</sup></a> classes within a `.row` of [the grid system](http://getbootstrap.com/2.3.2/scaffolding.html#gridSystem). And, these widths really are fixed. They remain the same regardless of the size of the window. However, switch to a `.container-fluid` class or put the `.span*` classes in a `.row-fluid` then the elements get a percent width instead so they resize 'fluidly' as the window resizes.

**Responsive: ** Now, if you include the [responsive css](http://getbootstrap.com/2.3.2/scaffolding.html#responsive) in your project you'll get a load of [media queries](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries). These are mostly based on `min-width` and `max-width` to resize elements for different screen sizes, etc. For example, the `.container` class and `.span*` classes within a `.row` still get a fixed width but that width will change discretely based on the size of the window.

Fair enough - so that seems really obvious now. I guess I was just being slow! *Fluid* makes things resize by percentages, without it they get a fixed pixel width. *Responsive* uses media queries to adjust the fixed width values based on screen size. But that doesn't answer my last question about whether you would ever want to use the fluid classes **and** the responsive media queries. After all, the media queries don't have any effect on the widths of the fluid elements as they resize based on percentages.

Well, there are other advantages to using the responsive css that are also useful with the fluid classes...

-  The responsive css controls more than just the widths of the container classes. It also resizes headings, for example, to keep things looking nice on all devices.
-  You get some convenient utility classes with the responsive css for hiding/showing elements on different devices (e.g., `.visible-phone`, `.hidden-phone`, etc)<a id="refNote2" href="#Note2"><sup>[2]</sup></a>
-  The `.span*` classes within a `.row-fluid` will get stacked below a certain size instead of remaining side-by-side and getting smaller and smaller.
-  There are some responsive components (such as the collapsing [navbar](http://getbootstrap.com/2.3.2/components.html#navbar)) which require the responsive features.

The answer, then, is a definite 'yes' - there are plenty of cases where you'd want to use the responsive and fluid features together. In fact, having gone through all of that, it seems that the default in Bootstrap v3.0 is now to include both fluid and responsive features from the start. Where v2.3.2 gave the choice of fluid and non-fluid versions of some classes (`.container/.container-fluid`, `.row/.row-fluid`), v3.0 has done away with the fixed grid and simplified the classes. (`.container` and `.row` now behave in a fluid way.) Similarly, the responsive css is now built in and no longer a separate stylesheet.

So, it looks like both fluid and responsive is the way forward and the changes in the new Bootstrap<a id="refNote3" href="#Note3"><sup>[3]</sup></a> make less of a distinction by including them both by default. Still, it's useful to understand a little bit about what's going on behind the scenes in the frameworks you use.

---

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note1" href="#refNote1">1.</a> <code>.col-md-*</code> in Bootstrap v3.0</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note2" href="#refNote2">2.</a> In v3.0 these have been renamed based on size rather than device type, i.e., <code>visible-sm</code>, <code>visible-md</code>, <code>visible-lg</code>, <code>hidden-sm</code>, <code>hidden-md</code>, <code>hidden-lg</code>.</p>

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note3" href="#refNote3">3.</a> There's more information about <a href="http://getbootstrap.com/getting-started/#migration">migrating to Bootstrap v3.0</a> in the documentation or in the announcement <a href="http://blog.getbootstrap.com/2013/08/19/bootstrap-3-released/">blog post</a>.</p>