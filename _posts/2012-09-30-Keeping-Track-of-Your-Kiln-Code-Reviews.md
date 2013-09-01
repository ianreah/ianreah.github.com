---
layout: post
title: A Kiln Glaze for Keeping Track of Your Code Reviews
date: 2012-09-30 10:57:00
---

<p><a href="https://www.fogcreek.com/kiln/"><img src="/img/kiln-logo.jpg" alt="Kiln - Mercurial Version Control and Code Review Software from Fog Creek Software" style="float: left; margin-right: 20px;" /></a></p>

Our team uses Fog Creek's [Kiln](https://www.fogcreek.com/kiln/) for our source control and a while ago we started making use of its [Code Review](https://www.fogcreek.com/kiln/features/code-reviews.html) features. We decided that we'd start out by reviewing everything that gets pushed to the kiln repository. We could pull back on this in the future if reviewing everything became too much and instead leave it to the developer pushing the code to decide if a review is required.

I think it's working really well and I don't think we should pull back on what we're reviewing. The reviews help to spread the knowledge of the code that's being worked on and they're helping to keep our code quality high.

<p><a href="https://www.fogcreek.com/kiln/features/code-reviews.html"><img src="/img/code-reviews.png" alt="Effortless Reviews, Inline Commenting" style="float: right; margin-left: 20px;"/></a></p>

If it really is something that doesn't need a review then it shouldn't take up a lot of time anyway. If we start choosing what to review then there's a danger we'd end up reviewing less and less of our code and eventually get out of the habit of reviewing all together.

We don't require a new review for each commit. A series of commits can be combined into a single review - just as long as each commit is part of a review somewhere. Even so, on our team of 9 developers, there are quite a lot of code reviews flying around, and I've found it quite frustrating trying to keep track of which reviews require my attention.

What I really want to see is a list containing:

1. The reviews I need to do (where I am a reviewer and I have not yet approved/rejected)
2. Reviews of my code that have been rejected (so I can follow up and fix the code as necessary).

The kiln reviews dashboard just doesn't provide this at the minute. After taking some pointers from Fog Creek's customer support I came up with the following [kiln glaze](http://blog.fogcreek.com/introducing-kiln-glazes/) to help highlight the reviews requiring your attention.

**Note:**  It is definitely a rough, temporary solution. I didn't want to spend a lot of time on it in case Fog Creek come up with a better, more permanent solution themselves. It hasn't had a lot of testing and comes with no guarantees, but feel free to try it if you think it will help you also.

{% highlight javascript %}
name:        Show Reviews To Do
description: With &showTodos=true on the url, lists only reviews that require
             your attention (i.e., undecided by you if viewing reviews with
             you as reviewer, or rejected reviews if viewing reviews of your
             code).
author:      Ian Reah
version:     1.0.0.0

js:

$(document).ready(function() {
  function querystring(key) {
    var regex=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
    var result=[], match;
    while ((match=regex.exec(document.location.search)) != null) {
      result.push(match[1]);
    }
    return result;
  }
  
  function hideReviewsExcept(dontHide) {
    allReviewLists = $('.reviewsList');
    reviewList = allReviewLists[allReviewLists.length - 1];
    reviews = reviewList.children;
  
    for (i=0; i < reviews.length; i++) {
      value = reviews[i].childNodes[5].innerText.toLowerCase();
		  
      if (value.indexOf(dontHide) == -1) 
      {
        reviews[i].hidden = true;
      }
    }
  }
  
  if(querystring('showTodos') == 'true') {
    if(querystring('ixPersonReviewer').length > 0) {
      hideReviewsExcept('undecided by you');
    } else if(querystring('ixPersonAuthor').length > 0) {
      hideReviewsExcept('rejected');
    }
  }
});
{% endhighlight %}

It works by looking for a parameter on the url `showTodos=true`. If this parameter is present then it will hide all reviews, other than those that require your attention.

The way it determines which reviews to hide depends on the type of reviews you are listing.  If you're listing reviews of your code then it will only show reviews that have been rejected - so you can easily see which reviews you need to follow up on and fix.  If you're listing reviews that have you as a reviewer then it will only show reviews marked as "undecided by you" - so you see which reviews you still need to do.

The best way I've found to use it is to save two bookmarks; one listing reviews of your code, and one listing code you're reviewing - each with the `showTodos` parameter on and specifying a large number of days (to make sure old reviews don't get missed)...

- https://example.kilnhg.com/Reviews?ixPersonReviewer=insert-your-user-number-here&showTodos=true&activeInDays=365
- https://example.kilnhg.com/Reviews?ixPersonAuthor=insert-your-user-number-here&showTodos=true&activeInDays=365

You still have two separate lists, rather than the single 'These Reviews Require Your Attention' list I was hoping for, but it's definitely an improvement.

