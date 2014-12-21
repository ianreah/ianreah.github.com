---
title: "A CoverFlow control implemented with KnockoutJS"
layout: post
date: 2014-12-21 20:03:00
---

[Last time](http://ianreah.com/2014/08/14/the-one-where-i-knock-out-another-coverflow.html) I outlined the approach I’m experimenting with to implement a CoverFlow
control that will work well even with a large collection of albums.
I’ve implemented it using the MVVM pattern with the help of KnockoutJS, so in this
post I’m going to describe some of the implementation details relating to the use
of KnockoutJS in the project.

KnockoutJS is a JavaScript MVVM library. In a nutshell, you implement your view
models in JavaScript using [observables](http://knockoutjs.com/documentation/observables.html),
and annotate your markup to describe bindings between the UI and these observables.
This helps to give you a clear separation between the UI components and the data being
displayed and, by automatically updating the right parts of the UI when the data
changes, it usually simplifies your code.


#### An introduction to observable properties

The backbone of the control is an unordered list containing images of the album
covers. For this demonstration I'm using the image placeholder service
[placehold.it](http://placehold.it/) for the image urls. Without any styling
or knockout bindings the markup will look something like this...

{% highlight html %}
<ul>
    <li><img src="http://placehold.it/100x100&amp;text=1"></li>
    <li><img src="http://placehold.it/100x100&amp;text=2"></li>
    <li><img src="http://placehold.it/100x100&amp;text=3"></li>
    <li><img src="http://placehold.it/100x100&amp;text=4"></li>
    <li><img src="http://placehold.it/100x100&amp;text=5"></li>
    <li><img src="http://placehold.it/100x100&amp;text=6"></li>
    <li><img src="http://placehold.it/100x100&amp;text=7"></li>
    <li><img src="http://placehold.it/100x100&amp;text=8"></li>
    <li><img src="http://placehold.it/100x100&amp;text=9"></li>
</ul>
{% endhighlight %}

We're going to use KnockoutJS to generate this.

We'll start with a JavaScript view model object to represent an individual item
in this list. For now, let's just give it a single property: `imageSource`, which
defines the source url for the image we want it to display.

{% highlight js %}
function ItemViewModel(sourceUrl) {
  this.imageSource = sourceUrl;
}

var vm = new ItemViewModel("http://placehold.it/100x100&text=1");
ko.applyBindings(vm);
{% endhighlight %}

That call to `ko.applyBindings` is important. For this simple example you can 
think of it as [activating KnockoutJS](http://knockoutjs.com/documentation/observables.html#activating-knockout)
by telling it [which view model object to associate with the bindings](http://knockoutjs.com/documentation/binding-context.html)
in the markup. We'll look at how to [define the bindings in the markup](http://knockoutjs.com/documentation/binding-syntax.html)
next.

To use the value of the `imageSource` property as the source url for an
image element we can use the [`attr` binding](http://knockoutjs.com/documentation/attr-binding.html).
For example, the following in the main body of your page...

{% highlight html %}
<img data-bind="attr: {src: imageSource}"/>
{% endhighlight %}

...should give you something like this...

<p style="text-align: center"><img src="/img/post-2014-10-12-placeholder.png" alt="img src bound to view model property" /></p>

This can be useful in itself, but we haven't really *bound* the
property to the source url. Try adding the following JavaScript that changes the
value of the view model property and see what happens...

{% highlight js %}
var n = 1;
setInterval(function () {
    vm.imageSource = "http://placehold.it/100x100&text=" + (++n);
}, 2000);
{% endhighlight %}

Oh - nothing happens. Even though the view model property is being updated
every 2 seconds the image source url is not updated after the initial value. To
get that behaviour we have to turn the view model property into a [KnockoutJS observable
property](http://knockoutjs.com/documentation/observables.html).

The changes to do that are very small in terms of the code, but it actually
means quite a significant change to the way you'll work with your view model properties. Let's
look at the changes first and then I'll explain what I mean.

To turn the property into an observable simply wrap it's initialisation in a call
to `ko.observable`...

{% highlight js %}
function ItemViewModel(sourceUrl) {
  this.imageSource = ko.observable(sourceUrl);
}
{% endhighlight %}

The `ko.observable` function records the initial value for the property (the
value passed in to the function) and ***returns a function***. The returned function
is what you use to interact with the property:

* Call it with no parameters to get the current value of the property, e.g., `var currentFoo = viewModel.foo()`,
* Update the value of the property by calling the function with the new value
as the parameter, e.g., `viewModel.foo("new value")`. The function then takes
care of notifying any subscribers of the new value.

The important point is that the member on the view model is now a function and 
not a simple property. Make a note of that. Really - write it down on a post-it and
stick it to your monitor or whatever. You will forget. After you've been using KnockoutJS
for a while and you're working 'in the zone', you'll
forget and write some code like...

{% highlight js %}
viewModel.foo = "new value";
{% endhighlight %}

...and then waste a lot of time working out why the UI is no longer updating.
Remember - ***access to the observable property is through a function***...

{% highlight js %}
viewModel.foo("new value");
{% endhighlight %}

Now the image source attribute really is *bound* to the value of the view model.
Try the following again and make sure you see the image change every two seconds.

{% highlight js %}
var n = 1;
setInterval(function () {
    vm.imageSource("http://placehold.it/100x100&text=" + (++n));
}, 2000);
{% endhighlight %}

#### Binding to collections

If you read the [previous post](http://ianreah.com/2014/08/14/the-one-where-i-knock-out-another-coverflow.html)
describing the overall approach of the control you'll remember that the control
is always going to contain 9 items. Items will be added to one end and removed
from the other as we move through the control. This can easily be handled with KnockoutJS
and [observable arrays](http://knockoutjs.com/documentation/observableArrays.html).

Let's introduce another view model that maintains an array of our ItemViewModels.

{% highlight js %}        
function CoverFlowViewModel() {
  var itemsArray = [];
  for (var i = 1; i < 10; i++) {
    itemsArray.push(new ItemViewModel("http://placehold.it/100x100&text=" + i));
  }
  
  this.items = ko.observableArray(itemsArray); 
}

var vm = new CoverFlowViewModel();
ko.applyBindings(vm);
{% endhighlight %}

Notice that the `items` property is turned into an observable array by passing
the underlying array to `ko.observableArray`.

The UI can be created using the [`foreach` binding](http://knockoutjs.com/documentation/foreach-binding.html)...

{% highlight html %}
<ul data-bind="foreach: items">
    <li><img data-bind="attr: {src: imageSource}"/></li>
</ul>
{% endhighlight %}

Which actually produces the markup I showed earlier...

{% highlight html %}
<ul>
    <li><img src="http://placehold.it/100x100&amp;text=1"></li>
    <li><img src="http://placehold.it/100x100&amp;text=2"></li>
    <li><img src="http://placehold.it/100x100&amp;text=3"></li>
    <li><img src="http://placehold.it/100x100&amp;text=4"></li>
    <li><img src="http://placehold.it/100x100&amp;text=5"></li>
    <li><img src="http://placehold.it/100x100&amp;text=6"></li>
    <li><img src="http://placehold.it/100x100&amp;text=7"></li>
    <li><img src="http://placehold.it/100x100&amp;text=8"></li>
    <li><img src="http://placehold.it/100x100&amp;text=9"></li>
</ul>
{% endhighlight %}

Can you see what happened there? The inner markup within the `foreach` binding
gets repeated for every item in the `items` property. Each copy of the markup is 
bound to the corresponding item in the array, so the bindings are interpreted in
the context of each `ItemViewModel`.

The `observableArray` has a lot of the same functions as a normal JavaScript array,
(`push`, `pop`, `shift`, `unshift`, etc). So, unlike observable properties, a lot
of the time you'll be working with them as if they were a normal array. The big
difference being that everytime you add or remove items then the UI will
automatically update.

Let's illustrate this with a `setInterval` again. The following code removes
the first item from the start of the array and pushes it back on to the end
of the array, every 2 seconds.

{% highlight js %}
setInterval(function () {
    var removed = vm.items.shift();
    vm.items.push(removed);
}, 2000);
{% endhighlight %}

If you run it now you'll see the images in the unordered list rotating. Hopefully
you can see that this actually takes us well on our way to a complete CoverFlow control,
with a relatively small amount of code. With some CSS and animations
it shouldn't take too much effort to go from the above simple example to a complete
CoverFlow control.

You can do a lot with the basics of KnockoutJS that we've covered here. That's
pretty much all you need to know to get started but of course
there's a lot more to it. To finish, I'm going to briefly mention some of the more
advanced aspects of using KnockoutJS that I've picked up during this project. It's
by no means exhaustive. Have a look through the [tutorials](http://learn.knockoutjs.com/)
and [documentation](http://knockoutjs.com/documentation/introduction.html) to see what
else you can pick up.

#### Some (slightly more) advanced KnockoutJS

***1. You can update the underlying array of an `observableArray` and then poke it to notify its observers***

In the previous example we illustrated moving through the coverflow by removing
an item from the front of the control and adding a new one to the end...

{% highlight js %}
observableArray.shift();
observableArray.push(...the next CoverFlow item...)
{% endhighlight %}

This produces two update notifications: one after the `shift` operation and one
after the `push`. It doesn't really make that much difference in this case, but
if you wanted to make a lot of changes to an `observableArray` without causing a
lot of UI updates you can make the updates on the underlying array and then
call `valueHasMutated` on the observableArray to produce a single update.

{% highlight js %}
underlyingArray.shift();
underlyingArray.push(...the next CoverFlow item...);

observableArray.valueHasMutated();
{% endhighlight %}

[Rate-limiting the notifications](http://knockoutjs.com/documentation/rateLimit-observable.html)
is another approach to controlling the number of updates which may be more appropriate
in some situations.

***2. You can define an observable as a function that depends on other observables. It will automatically update and notify when any of the dependencies change***

These are called [computed observables](http://knockoutjs.com/documentation/computedObservables.html).
Remember our very first view model example?...

{% highlight js %}
function ItemViewModel(sourceUrl) {
  this.imageSource = ko.observable(sourceUrl);
}
{% endhighlight %}

We updated the `imageSource` like this...

{% highlight js %}
var n = 1;
setInterval(function () {
    vm.imageSource("http://placehold.it/100x100&text=" + (++n));
}, 2000);
{% endhighlight %}

Notice how it's only the integer at the end of the url that changes? We could define
this using an observable property for the number and a computed observable for
the url...

{% highlight js %}
function ItemViewModel(index) {
  this.index = ko.observable(index);
  
  this.imageSource = ko.computed(function() {
    return "http://placehold.it/100x100&text=" + this.index();
  }, this);
}
{% endhighlight %}

Whenever the `index` observable updates then the `imageSource` computed observable
will also get an update. The following produces the same behaviour as the previous
example...

{% highlight js %}
var n = 1;
setInterval(function () {
    vm.index(++n);
}, 2000);
{% endhighlight %}

As often with JavaScript, you have to think about the context within a function
and the function used to define the computed observable is no different. The
second paramater to the `ko.computed` function specifies the value of `this`
when evaluating the function. In this example, we pass in a reference to the
view model itself enabling us to reference view model properties like `this.index()`.

***3. You can use observables to manipulate an element's CSS class and style from the view model***

The [CSS binding](http://knockoutjs.com/documentation/css-binding.html) adds or
removes named CSS classes.

As a quick example, take our simple view model again but add a `slidingStatus`
property...

{% highlight js %}
function ItemViewModel(sourceUrl) {
  this.imageSource = ko.observable(sourceUrl);
  this.slidingStatus = ko.observable("slide-reset");
}
{% endhighlight %}

Bind the property to the element using the `css` binding...

{% highlight html %}
<img data-bind="attr: {src: imageSource},
                css: slidingStatus"/>
{% endhighlight %}

The element will then get the `slide-reset` CSS class.

Now, setting the property on the view model with `vm.slidingStatus("slide-left")`,
for example, will remove the `slide-reset` class from the element and add
the new value (`slide-left`).

Try this to see it in action:

Create some appropriate CSS classes...

{% highlight css %}
img {
    transition: all 0.5s;
}
 
.slide-left {
    transform: translateX(-100px);
}
 
.slide-right {
    transform: translateX(100px);
}

.slide-reset {
    transform: translateX(0px);
}
{% endhighlight %}

...and add some JavaScript to update the property on the view model...

{% highlight js %}
var n = 0;
var statusses = ["slide-left", "slide-reset", "slide-right", "slide-reset", ]
setInterval(function () {
    vm.slidingStatus(statusses[n]);
    n = (n + 1) % 4;
}, 2000);
{% endhighlight %}

You can also add/remove a class based on the value of an observable. See
[the documentation](http://knockoutjs.com/documentation/css-binding.html) for
more details.

The [style binding](http://knockoutjs.com/documentation/style-binding.html)
is similar but sets specific style values directly instead of via a CSS class.

{% highlight html %}
<img data-bind="attr: {src: imageSource},
                css: slidingStatus,
                style: {transitionDuration: duration() + 's'}"/>
{% endhighlight %}

This updates the element's `style.transitionDuration` property as the `duration`
observable changes.

***4. You can keep your event handlers on the view model with KnockoutJS event binding***

Add an [event binding](http://knockoutjs.com/documentation/event-binding.html) to
an element like this...

{% highlight html %}
<ul data-bind="foreach: items,
               css: slidingStatus,
               style: {transitionDuration: duration() + 's'},
               event: {webkitTransitionEnd: completeTransition}">
...
</ul>
{% endhighlight %}

...and then define the handler function on your view model...

{% highlight js %}
this.completeTransition = function(data, event) {
  ...
};
{% endhighlight %}

The `completeTransition` function gets called when the `webkitTransitionEnd` event
is triggered for the `ul` element. So, in the CoverFlow control whenever we
transition from one item to the next (or previous), this function gets called
when the animations have finished. I use this to turn off the animations and shuffle
the items in the control (remove one from one an end and add a new one to the
other end), and reset the position (`slidingStatus`) of the control so it looks
like one smooth transition to the user.  I described this process in more detail
in my [previous post](http://ianreah.com/2014/08/14/the-one-where-i-knock-out-another-coverflow.html)
but now you should be able to see how I implemented it using KnockoutJS.

#### Conclusion

That about covers all the aspects of KnockoutJS that I used in this project. You can
see the [complete code on GitHub](https://github.com/ianreah/infinite-coverflow)
or have a [play around with it in action](http://ianreah.com/infinite-coverflow/).
It's not perfect and there's still plenty of room for improvement but it does work
better with large collections than my previous attempts. Also, I think I'm
done with my CoverFlow obsession - at least for now...