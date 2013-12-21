---
title: "Gruntifying a Spotify App"
layout: post
date: 2014-01-15 12:13:00
---

<p>
  <img src="/img/gruntify.png" alt="Gruntifying a Spotify App" class="wrapped-left" />
</p>

I promised myself that the next time I was going to do any JavaScript development I'd
[clean up my act](http://www.infoworld.com/d/application-development/web-app-coders-clean-your-act-228086) and put an
automated build process in place first.

Well it looks like my next JavaScript project is going to involve my Spotify App,
[Spotify-LibBrowser](http://ianreah.com/Spotify-LibBrowser/); I ran it for the first time in a while the other day and
noticed some serious performance issues that need to be addressed if it's to remain usable in new versions of Spotify.

Now, just because it's not a typical stand-alone application doesn't mean it shouldn't benefit from the efficiency and
code quality improvements that a good build process can help provide.
[Spotify Apps](https://developer.spotify.com/technologies/apps/) are created using HTML5, CSS and JavaScript, so there's
no reason why they can't make use of many of the same tools and technologies available to more standard web applications.

Because this was my first experience with most of these tools I've written this post as a log of how I did it. I use
[JSHint](http://www.jshint.com/) to provide static code analysis to make sure the JavaScript complies with a good set of
coding standards and [Jasmine](http://pivotal.github.io/jasmine/) to add some unit tests to the code.

I used [Grunt](http://gruntjs.com/) to automate these tasks, and finally, I set up a continuous integration build on
[Travis](https://travis-ci.org/) just to give that extra feedback and confidence that everything is running smoothly.

#### Setting up Grunt

Grunt runs on [Node.js](http://nodejs.org/) so, if you haven't already got it, you'll need to install that first. It's
really easy to install (even on Windows)!

The recommended way to get Grunt set up is to install the Grunt CLI globally, (so you can run `grunt` commands from any
folder), but install the actual Grunt task runner (and specific task plug-ins) locally. This allows you to have different
projects running on different versions of the Grunt task runner and you won't risk breaking existing projects by
installing a newer version for a new project.

Seeing as we've got Node.js now we might as well use the Node package manager (npm) to get grunt installed. The
following command installs the Grunt CLI globally...

<div class="highlight"><pre class="bash"><code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~/Spotify-LibBrowser (master)</span>
$ <span class="cmd">npm install -g grunt-cli</span>
<br>
</code></pre></div>

Next we need to install the task runner locally, but before we do that let's just think ahead a bit. Put yourself
in the shoes of a developer coming to your project and wanting to contribute. What we don't want to do is scare them
off with a long list of instructions on getting set up...'install version X of Y here, put Z in this folder, etc'!
Well, if we take a bit of care here and with the help of npm we can make things a lot easier for them (or even for
your future self when you come to set up your project on a new device).

First create a `package.json` file in the root of your project. It can be pretty minimal for now. At the very least
it needs a name and a version property...

{% highlight javascript %}
{
  "name": "Spotify-LibBrowser",
  "version": "0.1.0"
}
{% endhighlight %}

Now install the Grunt task runner locally with the following command. (Notice the `--save-dev` option.)

<div class="highlight"><pre class="bash"><code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~/Spotify-LibBrowser (master)</span>
$ <span class="cmd">npm install grunt --save-dev</span>
<br>
</code></pre></div>

So two things should have happened from that command:

1. The grunt task runner gets installed locally in a `node_modules` folder below the root of your project.
2. Your `package.json` file gets modified to include a `devDependencies` object with a `grunt` property.
(This is why that `--save-dev` option was important.)

{% highlight javascript %}
{
  "name": "Spotify-LibBrowser",
  "version": "0.1.0",
  "devDependencies": {
    "grunt": "~0.4.2"
  }
}
{% endhighlight %}

This means that anyone coming to your project can simply clone your repository and run `npm install`. The
Node package manager will read the `package.json` file and install the dependencies listed there. Of course,
this implies that the `package.json` file needs to be part of the repository but the big advantage of this
is that we don't need to clog up the repository with all of the dependencies. So, go ahead and add `node-modules`
to your `.gitignore` file (or whatever the ignore mechanism is for your type of version control) and commit
this with your `package.json` file.

Don't worry too much about that strange tilde `~` before the version number. It's just a way of
[specifying a version range](https://npmjs.org/doc/misc/semver.html#Ranges) in npm instead of tying it
down to a specific version. It really means: 'get the latest version of grunt greater or equal to 0.4.2
but less than 0.5. In other words, if there's been a point release then get it - you probably want any
bug fixes, etc, BUT if the major or minor versions increase I'm going to have to test it first to make
sure it still works so don't update to that'.

As a quick test to check that everything has installed correctly so far, try running the `grunt` command.
You should see the following error...

<div class="highlight"><pre class="bash"><code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~/Spotify-LibBrowser (master)</span>
$ <span class="cmd">grunt</span>
<br>
A valid Gruntfile could not be found. Please see the getting started guide for
more information on how to configure grunt: http://gruntjs.com/getting-started
<span class="err">Fatal error: Unable to find Gruntfile.</span>
</code></pre></div>

If you see this then it means the Grunt CLI is installed okay and it found your local installation of the Grunt
task runner, but then it didn't know what to do with it because we haven't defined any tasks for it to run yet.
Let's do that now.

#### JSHint: Our first Grunt task

The process for adding each task to the build is more or less the same. We'll go through the first one in detail.

**1. Install the task**

The code for a task is installed as a node module. You can [write your own](http://gruntjs.com/creating-plugins) but,
unless you're doing something pretty obscure, there's probably [already one available](http://gruntjs.com/plugins).
Once you've found (or written) the task you want, install it locally with npm using the `--save-dev` option (so it
gets added to the `package.json` file).

<div class="highlight"><pre class="bash"><code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~/Spotify-LibBrowser (master)</span>
$ <span class="cmd">npm install grunt-contrib-jshint --save-dev</span>
<br>
</code></pre></div>

**2. Configure the task**

The configuration for all tasks is held in a `Gruntfile.js` file in the root of your project. Tasks are configured by
passing in an object hash to the `grunt.initConfig` function (within a `module.exports` wrapper function, as shown below).
The configuration for a particular task is usually held in a property of this object hash with the same name as the task.

This is what my `Gruntfile.js` looks like with the JSHint task configured:

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'scripts/**/*.js', 'specs/**/*.js'],
      options: {
        ignores: ['scripts/jquery.tmpl.js', 'scripts/jquery-1.7.1.min.js',
          'scripts/knockout-2.0.0.js']
      }
    }
  });
};
{% endhighlight %}

The configuration options for the JSHint task should be fairly self-explanatory. Basically, examine all of my JavaScript
files, but ignore the third-party files specified.

**3. Load the task**

To let Grunt know which of our npm modules we want to run as tasks we need to load them with the `grunt.loadNpmTasks`
function after the `grunt.initConfig` call.

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    ...
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
};
{% endhighlight %}

**4. Run the task**

To see a list of available tasks run `grunt --help` and you'll see them listed after the command's usage instructions and options...

<div class="highlight"><pre class="bash"><code class="bash">
<span class="usr">Ian.Reah@IANREAH</span> <span class="pth">~/Spotify-LibBrowser (master)</span>
$ <span class="cmd">grunt --help</span>

...

Available tasks
        jshint  Validate files with JSHint. *

Tasks run in the order specified. Arguments may be passed to tasks that accept
them by using colons, like "lint:files". Tasks marked with * are "multi tasks"
and will iterate over all sub-targets if no argument is specified.

...
</code></pre></div>

The JSHint task can be run with `grunt jshint`.

**5. Automate it**

So, we've run the JSHint task and had all of our potentially bad JavaScript pointed out to us! Now, it's all very well
to go through fixing a couple of the issues and then running the task again, and so on. However, Grunt is all about
automation and saving us from repetitive tasks, so we can do better...

With `grunt-contrib-watch` we can configure it to automatically run our task whenever any of the files change. Because
`grunt-contrib-watch` is a grunt task itself then we repeat the same process to set it up:

- `npm install grunt-contrib-watch --save-dev` to install it
- Add the `watch` configuration to the `grunt.initConfig` object hash. The following configuration says, 'whenever
any JavaScript file changes, run the JSHint task'.

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      ...
    },
    watch: {
      files: ['**/*.js'],
      tasks: ['jshint']
    }
  });
  
  ...
};
{% endhighlight %}

- Add the `grunt.loadNpmTasks` call to load the task

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    ...
  });
  
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
{% endhighlight %}

- Run the task with `grunt watch`

This time you'll be able to fix some JSHint warnings and whenever you save the file then the JSHint task will be run
again so you can keep track of which ones are left to fix. Eventually, you'll see something like this...

<div class="highlight"><pre class="bash"><code class="bash">
<span style="color: DarkGreen">>></span> File "scripts\album.js" changed.

Running "jshint:files" (jshint) task
<span style="color: DarkGreen">>></span> 5 files lint free.

<span style="color: DarkGreen">Done, without errors.</span>
<span style="color: Teal">Completed in 1.747s at Tue Dec 31 2013 18:11:34 GMT+0000 (GMT Standard Time)</span>
Waiting...
</code></pre></div>

And, as you continue to work on your project, the JSHint will be continuously running in the background so you'll see immediately
if you cause any more JSHint violations!

Just one more note about JSHint before we move one. While you're fixing the warnings
[make sure you understand them](http://jslinterrors.com/). It's generally a bad idea to change the code if you don't really
understand why it's a problem in the first place and you can, in some cases, end up introducing bugs.

#### Unit tests with jasmine

So we've actually added two grunt tasks now, `jshint` and `watch`. Let's just whizz through another one to make sure we've
got the process nailed.

**1. Install the task** (and add it to our `package.json` as a dev dependency) - `npm install grunt-contrib-jasmine --save-dev`

**2. Configure the task** by specifying the task options in an object hash passed into the `grunt.initConfig` call in our
`Gruntfile.js` file

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      ...
    },
    jasmine: {
      src: ['scripts/album.js'],
      options: {
        helpers: ['specs/spechelper.js'],
        specs: ['specs/**/*.spec.js'],
        vendor: ['scripts/knockout-2.0.0.js']
      }
    },
    watch: {
      ...
    }
  });
  
  ...
};
{% endhighlight %}

In most cases you'd want to specify all of your JavaScript files in the Jasmine `src` option but for now I'm
just adding a simple test for one file. The purpose of this exercise is just to get the mechanism in place to
allow me to work in a more test-driven way from now on. I'm not aiming for 100% test coverage straight away.

The `vendor` option specifies any third-party dependencies that need to be loaded first. With the `helpers`
option you can specify any files containing mocks or other set up for the tests. These are loaded after the
`vendor` files. To run the simple test for the `album.js` file I just need a mock for the Spotify API and its
`exports` object...

*spechelper.js:*

{% highlight javascript %}
exports = {};
sp = {};
{% endhighlight %}

Finally the `specs` option specifies the files containing your tests. Here's the one basic test I added for now, just to make sure it's all
set up properly...

{% highlight javascript %}
describe("Album model", function () {
  it("should set name when constructed from a spotify album", function () {
    var mockSpotifyAlbum = {			
      artist: "Led Zeppelin",
      cover: "spotify:image:c89be3d95870abb652c16deef6e3d3e5174710ff",
      name: "Led Zeppelin IV",
      uri: "spotify:album:1Ugdi2OTxKopVVqsprp5pb"
    };
        
    var album = new Album(mockSpotifyAlbum);
    expect(album.name()).toBe("Led Zeppelin IV");
  });
});{% endhighlight %}

Check out the [plug-in's read me](https://github.com/gruntjs/grunt-contrib-jasmine/blob/master/README.md)
for more information about the configuration of the task and the [Jasmine website](http://pivotal.github.io/jasmine/)
for more details about writing Jasmine unit tests.

**3. Load the task** by adding a call to `grunt.loadNpmTasks` to the `Gruntfile.js` file

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    ...
  });
  
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
{% endhighlight %}

**4. Run the task** with `grunt jasmine`. (Remember you can always run `grunt --help` to check the list of available tasks and how to run them.)

**5. Automate it** by adding it to our `watch` task configuration...

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      ...
    },
    watch: {
      files: ['**/*.js'],
      tasks: ['jshint', 'jasmine']
    }
  });
  
  ...
};
{% endhighlight %}

...so now we can run `grunt watch` and every time we save a change to the JavaScript the jshint task will run and (assuming there are no JSHint errors)
then the unit tests will be run. Nice!

#### Publish it to the Spotify folder

To run the app in Spotify the files have to be in a specific folder:

- ~/Spotify (Mac OS X and Linux)
- "My Documents\Spotify" (Windows)

(Each app is in it's own subfolder.)

Now, I always felt a bit uncomfortable working in this folder. You've got your whole repository in there and now we've added a boat load of grunt and node
module files which have nothing to do with running the app in Spotify. I'd feel much better if I could keep all of this stuff away from the Spotify folder
and only copy the necessary files over when I want to test the app in Spotify. Surprise, surprise - you can do this with a Grunt task. You know the drill
by now...

- Install the task with `npm install grunt-contrib-copy --save-dev`
- Add the task configuration to the `Gruntfile.js` file

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    getSpotifyFolder: function() {
      var root;
      if (process.platform == 'win32') {
        root = process.env.USERPROFILE + '/Documents';
      } else {
        root = process.env.HOME;
      }

      return root + '/Spotify/Spotify-LibBrowser/';
    },
    ...
    copy: {
      main: {
        src: ['manifest.json', 'index.html', 'images/*', 'scripts/*', 'styles/*'],
        dest: '<%= getSpotifyFolder() %>'
      }
    }
  });
  
  ...
};
{% endhighlight %}

The `manifest.json` and `index.html` along with any images, scripts and styles are all we need to run the app in Spotify.

Notice that we're now taking advantage of the fact that the grunt configuration is actual JavaScript (not just JSON) by including a function to determine the
path for the Spotify folder. Also we can template values within `<% %>` delimiters. The config object is the context when these templated values are resolved,
which is why we can call `getSpotifyFolder` to set the value for the `dest` option in the `copy` task configuration. You can read more about using templates
to configure tasks in the [grunt documentation](http://gruntjs.com/configuring-tasks).

- Load the task by adding a call to `grunt.loadNpmTasks('grunt-contrib-copy')` to the `Gruntfile.js` file
- Run the task with `grunt copy`
- Automate it by adding it to our `watch` task configuration

{% highlight javascript %}
module.exports = function(grunt) {
  grunt.initConfig({
    ...
    watch: {
      files: ['**/*.js'],
      tasks: ['jshint', 'jasmine', 'copy']
    }
  });
  
  ...
};
{% endhighlight %}

So running `grunt watch` now will run the `jshint`, `jasmine` and `copy` tasks whenever there are any JavaScript changes in the project. The advantage is that,
by default, the chain of tasks executed by the `watch` task stops as soon as any task fails. In other words, it will only end up in the Spotify folder if there
are no JSHint errors in the JavaScript and all unit tests pass.

#### Make a Continuous Integration build with Travis

We've got all our tasks set up locally, and of course, no one would ever dream of publishing changes to the remote repository without first making sure
all of the tasks run successfully! Nevertheless, it's still important to have an automated build that does a clean checkout and runs all of the tasks
whenever anything gets pushed to the remote repository. There may be some local dependencies you'd overlooked that could cause problems if somebody else
tries to pull your changes, for example. An automated build catches things like this early and gives you some added confidence that all is well with your code.

For this I used [Travis](https://travis-ci.org/). It's integrated with GitHub and it's really easy to [get started](http://about.travis-ci.org/docs/user/getting-started/).

For a Node.js project, Travis runs `npm test` to run the test suite. So, once you've 
[set up the GitHub service hook](http://about.travis-ci.org/docs/user/getting-started/#Step-two%3A-Activate-GitHub-Service-Hook)
and [added your .travis.yml to your project](http://about.travis-ci.org/docs/user/getting-started/#Step-three%3A-Add-.travis.yml-file-to-your-repository),
you need to tell Travis what running the test suite actually means. In our case, this means telling it which Grunt tasks to run.

Use the `scripts` configuration in the `package.json` to tell it to run our `jshint` and `jasmine` tasks...

{% highlight javascript %}
{
  ...
  "scripts": {
    "test": "grunt jshint jasmine --verbose"
  },
  ...
}
{% endhighlight %}

(The `--verbose` option can be useful, especially if you find yourself in a 'but it works on my machine' situation!)

Finally, there's just one little *gotcha* we need to work around to get this to work. Remember how we didn't make the Grunt CLI a dev-dependency
as typically that's installed globally? Well each build is deliberately run in a vanilla environment so the CLI won't be available from scratch.
We can tell Travis to install the Grunt CLI first by using the `before_install` configuration in the `.travis.yml` file.

My `.travis.yml` file looks like this...

{% highlight xml %}
language: node_js
node_js:
  - "0.10"
  - "0.8"
before_install:
  - npm install -g grunt-cli
{% endhighlight %}

Now you can [grab your status badge](http://about.travis-ci.org/docs/user/status-images/) and wear it with pride
(or just stick it on your README file)...

[![Build Status](https://travis-ci.org/ianreah/Spotify-LibBrowser.png?branch=master)](https://travis-ci.org/ianreah/Spotify-LibBrowser)<a id="refNote1" href="#Note1"><sup>[1]</sup></a>

...you're now well on your way to [cleaning up your act](http://www.infoworld.com/d/application-development/web-app-coders-clean-your-act-228086)!

---

<p style="font-size: smaller; margin-left: 20px;
margin-right: 20px;"><a id="Note1" href="#refNote1">1.</a> I really hope it's green while you're reading this!</p>
