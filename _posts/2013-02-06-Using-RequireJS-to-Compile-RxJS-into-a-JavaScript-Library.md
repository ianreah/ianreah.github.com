---
layout: post
title: Using RequireJS to Compile RxJS into a JavaScript Library
date: 2013-02-06 18:32:00
---

<p><a href="http://reactive-extensions.github.com/RxJS/"><img src="/img/rx-logo.png" alt="Reactive Extensions for JavaScript" class="wrapped-left" /></a></p>

I'm a big fan of the [Reactive Extensions (Rx) .NET library](http://msdn.microsoft.com/en-us/data/gg577609.aspx) so, naturally, I've been keen to try out [Reactive Extensions for JavaScript (RxJS)](http://reactive-extensions.github.com/RxJS/) in some of my JavaScript development.

One thing about Rx is that it can become quite pervasive in your code. Once you start using it, you'll want to use it *everywhere*.

Now, that isn't necessarily a bad thing, but if I'm writing a JavaScript library, I don't want to put people off using it by requiring them to download and include some other third-party stuff as well!

In fact, RxJS is actually a set of libraries: a [core library](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.js) and a bunch of optional extras to incorporate things like [time-based event processing](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.time.js), [aggregation](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.aggregates.js), [etc](https://github.com/Reactive-Extensions/RxJS#readme). This has the advantage that I don't need to include the parts I don't use, but it does mean users could be required to download and include 3 or 4 (or more) files just to use my library, depending on how much of RxJS I use.

<p><a href="http://requirejs.org/"><img src="/img/requirejs-logo.png" alt="RequireJS - A JavaScript Module Loader" class="wrapped-right" /></a></p>

The good news is that [RxJS has good support for RequireJS](https://twitter.com/mattpodwysocki/status/246115294588837888).

[RequireJS](http://requirejs.org/) is a JavaScript file and module loader. It also contains [an optimization tool](http://requirejs.org/docs/optimization.html) to combine and minify the code. In this post I'll describe how I used this to combine RxJS with my library into a single, minified file which can be used without requiring any other dependencies, and still allow as much flexibility as possible in the way the library can be used, (i.e., without simply replacing the RxJS dependencies with the requirement that it can only be run with RequireJS or similar module loader).

I'll also touch on how the RequireJS optimizer can be used with [Google's Closure Compiler](https://developers.google.com/closure/compiler/) in advanced mode to get even smaller minified output.

#### An Example

For illustration purposes let's start with a simple (and pointless) library that uses some RxJS. We'll call it `myLibrary`. `myLibrary` provides a single function, `onSecondsUpdate`, which repeatedly calls any function we give it, every second, passing in an incremented integer value each time (0, 1, 2, 3, etc...). `myLibrary` might look something like this...

*myLibrary.js:*
{% highlight javascript %}
(function (window, undefined) {
  var seconds = Rx.Observable.interval(1000);
	
  window.myLibrary = {
    onSecondsUpdate: function (action) {
        seconds.subscribe(action);
    }
  };
}(this));
{% endhighlight %}

The code requires the [core RxJS library (rx.js)](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.js) and also the [rx.time.js](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.time.js) library to provide the [interval](https://github.com/Reactive-Extensions/RxJS/wiki/Observable#wiki-interval) function. We could use `myLibrary` like this...

*main.js:*
{% highlight javascript %}
var seconds = document.getElementById("seconds");
myLibrary.onSecondsUpdate(function (s) {
  seconds.innerHTML = s;
});
{% endhighlight %}

The result would be that the element in the document with id "seconds" would get its inner HTML set to an increasing integer value every second. See: <span id="seconds" style="font-weight: bold;"> </span> ...wow!

Of course, to use it we need to include all the required scripts in the right order...

{% highlight html %}
<script src="scripts/rx.js"></script>
<script src="scripts/rx.time.js"></script>
<script src="scripts/myLibrary.js"></script>
<script src="scripts/main.js"></script>
{% endhighlight %}

#### Using RequireJS

We can improve this by using RequireJS to resolve and load the dependencies. The RxJS libraries already have support for RequireJS so we just need to add it to `myLibrary` and `main.js`. So, without going into any details of the [RequireJS API](http://requirejs.org/docs/api.html), our library and its usage could be changed to something like...

*myLibrary.js:*
{% highlight javascript %}
define (['rx.time'], function(Rx) {
  var seconds = Rx.Observable.interval(1000);
	
  return {
    onSecondsUpdate: function (action) {
        seconds.subscribe(action);
    }
  };
});
{% endhighlight %}

*main.js:*
{% highlight javascript %}
require (['myLibrary'], function(myLibrary) {
  var seconds = document.getElementById("seconds");
  myLibrary.onSecondsUpdate(function (s) {
    seconds.innerHTML = s;
  });
});
{% endhighlight %}

And then, in the page we'd only need the single script tag for `require.js`, with a `data-main` attribute to tell it to start its script loading at `main.js`...

{% highlight html %}
<script data-main="scripts/main" src="scripts/require.js"></script>
{% endhighlight %}

Now, that's taken away the job of worrying about which script tags to add and in what order, but it still requires us (or any user of the library) to make sure the library file and the appropriate RxJS files are available to the loader. In fact, in that respect we've made it worse because we now need the `require.js` file as well!

Maybe the optimization tool could help us with that?...

#### Introducing the RequireJS Optimizer

The [RequireJS optimization tool](http://requirejs.org/docs/optimization.html) can look at our dependencies and work out how to combine the code into a single file. By default, it will then minify it via [UglifyJS](https://github.com/mishoo/UglifyJS). The tool can be downloaded from the [RequireJS download page](http://requirejs.org/docs/download.html#rjs). The easiest way to use it is with [Node](http://nodejs.org/) (v0.4.0 or later).

So, once we've downloaded the optimizer and have an appropriate version of Node installed, we can run it with the `-o` option, specifying the entry point to our code with the `name` parameter and the file for the combined and minified output with the `out` parameter...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~rjs-example/scripts</span>
$ <span class="cmd">node r.js -o name=main out=main.min.js</span>
</br>
Tracing dependencies for: main
Uglifying file: c:/Users/ian.reah/rjs-example/scripts/main.min.js

c:/Users/ian.reah/rjs-example/scripts/main.min.js
----------------
./rx.js
./rx.time.js
./myLibrary.js
./main.js
</code></pre>
</div>

And now we'd just need the two files to run our code: `require.js` and the output from the optimizer, `main.min.js`. There are ways to [get around having to include require.js](https://github.com/jrburke/almond#readme) as well, but that's not necessarily what we're aiming for here. Actually, we don't want to combine *all* of the code into a single file at all. We're looking for a way to combine the library and its dependencies so they can be easily used within our `main.js` code (and anywhere else we want to make use of the library's functionality).

Let's try optimizing just the library file & its dependencies...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~rjs-example/scripts</span>
$ <span class="cmd">node r.js -o name=myLibrary out=myLibrary.min.js</span>
</br>
Tracing dependencies for: myLibrary
Uglifying file: c:/Users/ian.reah/rjs-example/scripts/myLibrary.min.js

c:/Users/ian.reah/rjs-example/scripts/myLibrary.min.js
----------------
./rx.js
./rx.time.js
./myLibrary.js
</code></pre>
</div>

...and then changing our main code to use the minified version of the library...

*main.js:*
{% highlight javascript %}
require (['myLibrary.min'], function(myLibrary) {
    ...
});
{% endhighlight %}

Oh, the code no longer works. When the main callback function gets called, `myLibrary` is undefined!

<p style="text-align: center"><img src="/img/post-2013-02-01-uncaught-type-error.png" alt="Uncaught TypeError: Cannot call method 'onSecondsUpdate' of undefined" /></p>

So, what happened?

Well, in the original library code we defined the module without a name so its name gets inferred from the filename. That is, when we say `require ['myLibrary'], ...` it goes to `myLibrary.js`. This is the preferred way of defining modules. (It is possible to define a module with a name, but [this is discouraged](http://requirejs.org/docs/api.html#modulename).)

Obviously, the optimization tool needs to add the names to allow more than one module in the same file. This means that in the optimized code, in the `myLibrary.min.js` file, the library module will be named `myLibrary` after the file it came from. However, in the `main.js` code above `require (['myLibrary.min'], ...` is looking for a module named `myLibrary.min` in the `myLibrary.min.js` file.

There are a few approaches to fixing this...

<ol>
<li>Rename the minified file to <code>myLibrary.js</code> and specify the dependency in <code>main.js</code> as <code>['myLibrary']</code> as before. This means the code is back to searching for a module named <code>myLibrary</code> in a file called <code>myLibrary.js</code> and everyone is happy again. The down side is that we've moved away from what seems to be the accepted convention of naming minified files as <em>original-name</em><strong>.min</strong>.js.</li>

<li>There is a way to leave the minified file with its <code>.min.js</code> name and reference the dependency in our main code with the correct name, i.e, <code>require (['myLibrary'], ...</code>. To make this work we need to add a path to the <a href="http://requirejs.org/docs/api.html#config">RequireJS config</a>...

{% highlight javascript %}
require.config({
  paths: {
    "myLibrary": "myLibrary.min"
  },
});
{% endhighlight %}

This configuration says, <em>"when a module named <code>myLibrary</code> is required, look for it in a file called <code>myLibrary.min.js</code>"</em>. The problem with this solution though is that the configuration has to be done at the point where the library is used, not when we optimize it. So we're putting extra responsibilities on the users of the library where the whole point of this exercise is to make it as simple as possible to use!</li>

<li>Another approach is to add an extra module to the optimized code named <code>myLibrary.min</code> which returns the <code>myLibrary</code> module...

{% highlight javascript %}
define('myLibrary.min',['myLibrary'], function(lib) {
  return lib;
});
{% endhighlight %}

We can even tell the optimizer to add this extra module for us using the <code>wrap.end</code> option:

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~rjs-example/scripts</span>
$ <span class="cmd">node r.js -o name=myLibrary out=myLibrary.min.js \
> wrap.end="define('myLibrary.min',['myLibrary'], function(lib) {return lib;});"</span>
</br>
</code></pre>
</div>

It's perhaps not a very elegant solution, but its advantage is that it is hidden from users of the library. We're giving them a file called <code>myLibrary.min.js</code> so to require it in their code they use <code>require (['myLibrary.min'], ...</code>.</li>
</ol>

#### Usage without RequireJS

To recap, we've now got two versions of our library:

1. The raw JavaScript in `myLibrary.js` which can be used for development, debugging, or just reading and understanding the code, but needs `rx.js` and `rx.time.js` to go along with it.
2. The combined and minified code in `myLibrary.min.js` which can be used on its own (without the separate `rx.js` and `rx.time.js` files).

The problem we have now though is that, because of the way we have defined the library, both of the above versions can only be used in a project that is using RequireJS (or some other module loader that is compatible with the `define`/`require` syntax we've used).

To get around this we can look to the RxJS libraries for inspiration. We've already been using the RxJS libraries in both settings: a project using RequireJS and one with plain old 'include the dependencies with script tags'. And I haven't heard either of them complain once!

If you look at the [rx.time.js](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.time.js) library we've been using, you can see that it achieves this by defining the library in a 'factory' function. The 'factory' function can get called in various ways depending on which module loader features are detected.

The RxJS code checks for a couple of different flavours of module loaders before falling back to adding to the root object. We could do something similar with our library. (For simplicity, I've only included the check for RequireJS or similar. This can be extended to cover other module loader 'flavours'.)

{% highlight javascript %}
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // We're using RequireJS, 'define' the library & its dependencies...
    define(['rx.time'], function (Rx) {
      return factory(Rx);
    });
  } else {
    // No RequireJS, fallback to adding to the root object
    // (assume the dependencies are already available on the root)
    root.myLibrary = factory(root.Rx);
  }
}(this, function (Rx) {
  // The actual library definition...

  var seconds = Rx.Observable.interval(1000);

  return {
    onSecondsUpdate: function (action) {
      seconds.subscribe(action);
    }
  };
}));
{% endhighlight %}

We also need to do something similar with the `myLibrary.min` definition we added to the end of the optimized code with the `wrap.end` option. In this case I don't think we need any fallback. I'm assuming that anyone using the optimized code without RequireJS would still expect to find a `myLibrary` object on the root object, not `myLibrary.min`!

Also, because the code we want to add with `wrap.end` is getting a bit too complicated to put on a command line we can instead put it in a file (I've called the file `wrap.end`) and then specify the file using the `wrap.endFile` command line option...

*wrap.end:*
{% highlight javascript %}
if (typeof define === 'function' && define.amd) {
  define ('myLibrary.min', ['myLibrary'], function(lib) {
    return lib;
  });
}
{% endhighlight %}

*compile command:*

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~rjs-example/scripts</span>
$ <span class="cmd">node r.js -o name=myLibrary out=myLibrary.min.js wrap.endFile=wrap.end</span>
</br>
Tracing dependencies for: myLibrary
Uglifying file: c:/Users/ian.reah/rjs-example/scripts/myLibrary.min.js

c:/Users/ian.reah/rjs-example/scripts/myLibrary.min.js
----------------
./rx.js
./rx.time.js
./myLibrary.js
</code></pre>
</div>

So now both our original library and the optimized version can be used with or without RequireJS...

#### To use the original library without RequireJS:

Include the scripts...

{% highlight html %}
<script src="scripts/rx.js"></script>
<script src="scripts/rx.time.js"></script>
<script src="scripts/myLibrary.js"></script>
<script src="scripts/main.js"></script>
{% endhighlight %}

...and access the library object in `main.js`...

{% highlight javascript %}
var seconds = document.getElementById("seconds");
myLibrary.onSecondsUpdate(function (s) {
  seconds.innerHTML = s;
});
{% endhighlight %}

#### To use the original library with RequireJS:

Include the single script tag for `require.js`, with a `data-main` attribute...

{% highlight html %}
<script data-main="scripts/main" src="scripts/require.js"></script>
{% endhighlight %}

...and specify the dependency on the library in `main.js`...

{% highlight javascript %}
require (['myLibrary'], function(myLibrary) {
  var seconds = document.getElementById("seconds");
  myLibrary.onSecondsUpdate(function (s) {
    seconds.innerHTML = s;
  });
});
{% endhighlight %}

#### To use the optimized library without RequireJS:

Include the minified script...

{% highlight html %}
<script src="scripts/myLibrary.min.js"></script>
<script src="scripts/main.js"></script>
{% endhighlight %}

...and access the library object in `main.js` (as with using the original library without RequireJS)...

{% highlight javascript %}
var seconds = document.getElementById("seconds");
myLibrary.onSecondsUpdate(function (s) {
  seconds.innerHTML = s;
});
{% endhighlight %}

#### To use the optimized library with RequireJS:

Include the single script tag for `require.js`, with a `data-main` attribute (as with using original library with RequireJS)...

{% highlight html %}
<script data-main="scripts/main" src="scripts/require.js"></script>
{% endhighlight %}

...and specify the dependency on the minified library in `main.js`...

{% highlight javascript %}
require (['myLibrary.min'], function(myLibrary) {
  var seconds = document.getElementById("seconds");
  myLibrary.onSecondsUpdate(function (s) {
    seconds.innerHTML = s;
  });
});
{% endhighlight %}

#### Using the Closure Compiler

If you [run the RequireJS optimizer using Java](https://github.com/jrburke/r.js#java) then you also have the option of minifying with [Google's Closure Compiler](https://developers.google.com/closure/compiler/) as an alternative to UglifyJS.

Using the Closure Compiler in [advanced mode](https://developers.google.com/closure/compiler/docs/api-tutorial3) can achieve much better compression rates. It does this by using more aggressive renaming and applying some other code-shrinking techniques such as dead code removal and function inlining.

In an ideal world, the Closure Compiler would use its dead code removal to detect and strip out the parts of the RxJS libraries that I'm not using. However, I suspect that the way we've structured the code (module callbacks, conditional support for different loaders, etc) has made it pretty difficult to analyse statically and detect the dead code with any certainty.

Even so, the advanced optimizations can still make a big difference, but there are a couple of things we need to take care of to get it to work. The effort required will vary from case to case so you need to decide whether it's worth it!

Firstly, we need to take steps to 'tame' the aggressive renaming, otherwise it could get carried away and rename our library and its public functions as well which would make it quite tricky to use! The easiest way to do this is to use strings to name the objects and functions we don't want renamed. The compiler will never rename anything in a string literal.

So, where we add the library object to the root object in the non-RequireJS case we'd specify it as...

{% highlight javascript %}
root['myLibrary'] = factory(root.Rx);
{% endhighlight %}

...instead of...

{% highlight javascript %}
root.myLibrary = factory(root.Rx);
{% endhighlight %}

Similarly, where we define the library in the factory function we need to put `onSecondsUpdate` in quotes to prevent it getting renamed...

{% highlight javascript %}
'onSecondsUpdate': function (action) ...
{% endhighlight %}

We also need to give the compiler some 'hints' about external code that's used by our library but not included in the compilation. This is done by [declaring externs](https://developers.google.com/closure/compiler/docs/api-tutorial3#externs). There is more information about creating an externs file [here](http://code.google.com/p/closure-compiler/wiki/FAQ#How_do_I_write_an_externs_file?). In our case, we need to do this for the RequireJS library, and it would look like this:

*externs.js:*
{% highlight javascript %}
var define = {
    "amd": {
        "jQuery": {}
    }
}
{% endhighlight %}

One last thing...

I found running the optimizer with Java to be much slower than with Node. This isn't really a big deal because you'll probably only be running it once you've finished a chunk of development and want to publish your minified file. Anyway, I found it easier (and quicker) to not run the optimizer with Java and instead create a script which ran the optimizer with Node, without minifying the code (`optimize=none`), and then run the Closure Compiler on the output.

*compile.sh:*

{% highlight bat %}
node r.js -o name=myLibrary out=myLibrary.tmp wrap.endFile=wrap.end optimize=none
java -jar compiler.jar --js myLibrary.tmp --compilation_level=ADVANCED_OPTIMIZATIONS \
  --js_output_file myLibrary.min.js --externs externs.js
{% endhighlight %}

The `compiler.jar` for the Closure Compiler can be downloaded [here](http://closure-compiler.googlecode.com/files/compiler-latest.zip).

<script src="/js/Using-RequireJS-to-Compile-RxJS-into-a-JavaScript-Library/rx.js"> </script>
<script src="/js/Using-RequireJS-to-Compile-RxJS-into-a-JavaScript-Library/rx.time.js"> </script>
<script src="/js/Using-RequireJS-to-Compile-RxJS-into-a-JavaScript-Library/myLibrary.js"> </script>
<script src="/js/Using-RequireJS-to-Compile-RxJS-into-a-JavaScript-Library/main.js"> </script>