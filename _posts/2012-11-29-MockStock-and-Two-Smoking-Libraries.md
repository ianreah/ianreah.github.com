---
layout: post
title: MockStock and Two Smoking Libraries...
date: 2012-11-29 17:33:00
---

<p><a href="http://mockstock.apphb.com/"><img src="/img/post-2012-11-16-mockstock-screenshot.png" alt="MockStock - A mock stock price subscription service using SignalR and Rx" class="wrapped-right" /></a></p>

*...or, using [SignalR](http://signalr.net/) and [Rx](http://msdn.microsoft.com/en-us/data/gg577609.aspx) to simulate a real-time web application.*

#### Introduction ####

In this post I'll outline the implementation of a fake stock price subscription service. It'll focus mainly on the use of SignalR to transmit the stock price data to the clients and also summarize the use of Rx to generate the real-time sequences of price updates.

To make the application (semi-) realistic I came up with the following requirements:

- The prices can be randomly generated, with random fluctuations (say, &plusmn;0.5) at random time intervals (around every second, or so)
- Multiple clients subscribed to the same stock should however see the same stream of random prices.
- It shouldn't waste time sending price updates to a client that isn't watching that stock.

In other words:

- We need a way to simulate the real-time nature of the price data.
- We need a way of transmitting the same data to a group of clients in real-time.
- We need to track client subscriptions to manage the lifetime of the subscriptions.

My question was: "Can I use [SignalR](http://signalr.net/) and [Rx](http://msdn.microsoft.com/en-us/data/gg577609.aspx) to do this effectively?"

#### SignalR + Rx ####

[Rx](http://msdn.microsoft.com/en-us/data/gg577609.aspx) (or Reactive Extensions) is a library for creating and composing asynchronous streams of data using observable sequences and LINQ-style query operators.

[SignalR](http://signalr.net/) is an integrated client-and-server library to help build real-time, multi-user interactive web applications.

It seems there's a lot of potential for using these libraries in a very complementary manner - where Rx presents a stream of data in a timely manner and SignalR transmits this data in real-time to appropriate clients.

Rx does have a bit of a learning curve as it encourages a change in the way you approach certain coding problems. With Rx, your code becomes less imperative and more declarative which typically results in less code,
more maintainable code and can help to manage complexities like concurrency, etc. [introtorx.com](http://www.introtorx.com/) is a great resource for learning Rx.

On the other hand, SignalR's main purpose is to make it incredibly simple to add real-time web functionality to your application so (by design) it is very easy to get started with SignalR...

#### Getting started with SignalR ####

Simply install the [SignalR NuGet packages](http://nuget.org/packages/signalr) into your web application and create a class derived from `SignalR.Hubs.Hub`...

{% highlight csharp %}
public class StockHub : Hub
{
}
{% endhighlight %}

To expose methods on the hub that you want to be callable from the client, simply declare them as public methods...

{% highlight csharp %}
public class StockHub : Hub
{
    public void Subscribe(string symbol)
    {
        ...
    }

    public void Unsubscribe(string symbol)
    {
        ...
    }
}
{% endhighlight %}

If you run your application and go to `/signalr/hubs` in your browser (e.g., http://localhost:54115/signalr/hubs) you should see some JavaScript that has been dynamically generated based on the `Hub` classes you declared. For example, with the `StockHub` class shown above, you'll see the following JavaScript object somewhere near the bottom of `/signalr/hubs`. The two methods on the `StockHub` class are reflected on the JavaScript object, (with a slight difference in the casing of the method names, which I assume is purely to match the coding standards in each language).

{% highlight javascript %}
signalR.stockHub = {
    _: {
        hubName: 'StockHub',
        ignoreMembers: ['subscribe', 'unsubscribe'],
        connection: function () { return signalR.hub; }
    },

    subscribe: function (symbol) {
        return invoke(this, "Subscribe", $.makeArray(arguments));
    },

    unsubscribe: function (symbol) {
        return invoke(this, "Unsubscribe", $.makeArray(arguments));
    }
};
{% endhighlight %}

This object can be accessed in your client-side JavaScript through the SignalR jQuery plugin, `$.connection`. Calling functions on the object will effectively invoke the equivalent methods on the server...

{% highlight html %}
<script src="Scripts/jquery-1.7.2.min.js" type="text/javascript"></script>
<script src="Scripts/jquery.signalR.min.js" type="text/javascript"></script>
<script src="/signalr/hubs" type="text/javascript"></script>

<script type="text/javascript">
    $(function () {
        // Get our stockHub JavaScript object
        var stockHub = $.connection.stockHub;

        // Set up a handler to call the 'subscribe'
        // method on the server        
        $("#form1").submit(function () {
            stockHub.subscribe('XYZ');
        });

        // Start the connection
        $.connection.hub.start();
    });
</script>
{% endhighlight %}

You can also add functions to the JavaScript object to make them callable from the server...

{% highlight javascript %}
// Add a function to the JavaScript object
// to call from the server
stockHub.updatePrice = function (stockPrice) {
    ...
};
{% endhighlight %}

In the server's hub class, use the dynamic property, `Clients`, to call functions on the client object...

{% highlight csharp %}
public class StockHub : Hub
{
    private void PriceUpdated(StockPrice newPrice)
    {
        Clients.updatePrice(newPrice);
    }
}
{% endhighlight %}

The above will call the `updatePrice` function on *all* clients. To fulfill our requirement of only sending price updates to clients that have subscribed to that stock we can use the hub's `Groups` property...

{% highlight csharp %}
public class StockHub : Hub
{
    public void Subscribe(string symbol)
    {
        // Add the calling client (Context.ConnectionId) to a group
        // using the stock symbol as the group name...
        Groups.Add(Context.ConnectionId, symbol);
    }
}
{% endhighlight %}

So now, when a client subscribes to a stock, it calls our `Subscribe` method on the hub object and the server will add it to a group based on the stock symbol.  Similarly, we can implement the Unsubscribe method to remove clients from the group when they no longer want to subscribe to a particular stock...

{% highlight csharp %}
public void Unsubscribe(string symbol)
{
    Groups.Remove(Context.ConnectionId, symbol);
}
{% endhighlight %}

When we have an update for a stock price we can now send it to only those clients interested in that stock by sending it to the group, as shown...

{% highlight csharp %}
private void PriceUpdated(StockPrice newPrice)
{
    Clients[newPrice.Symbol].updatePrice(newPrice);
}
{% endhighlight %}

The `Clients`, `Groups` and `Context` properties of the hub provide the flexibility to send messages to all clients, a specific client, groups of clients, only the calling client, etc.  For more information check the [hub documentation](https://github.com/SignalR/SignalR/wiki/Hubs).

#### Adding some Rx ####

There's actually not much to the Rx in this example. This is partly because, by its nature, you end up being able to do quite a lot with a little code in Rx. Hopefully it's enough to show the potential of putting these libraries together in more complex situations.

The first time a stock is subscribed to the price feed gets generated as an observable sequence of `StockPrice` using the static [`Observable.Generate`](http://msdn.microsoft.com/en-us/library/system.reactive.linq.observable.generate.aspx) method...

{% highlight csharp %}
var random = new Random();
IObservable<StockPrice> priceFeed = Observable.Generate(
        new StockPrice(symbol, random.NextDouble() * 100),
        p => true,
        p => p.NextPrice(random.NextDouble() - 0.5),
        p => p,
        p => TimeSpan.FromSeconds(random.NextDouble() + 0.5)
);
{% endhighlight %}

This generates the observable sequence starting with an initial state (which is specified by the first parameter - a new `StockPrice` with a random starting price between 0 and 100). The sequence continues until a condition fails. The second parameter specifies the condition. In our case, `p => true`, means the sequence will continue indefinitely. The third parameter specifies how to produce the next value in the sequence. The `NextPrice` method on our `StockPrice` object adjusts the stock price with a given random fluctuation and returns it.  The fourth parameter is a selection function to specify how to present the values in the sequence.  In our case, we just want to present the `StockPrice` objects. The time span function in the last parameter controls the speed the values are produced. Again, we provide a random value so that values will appear in the sequence between 0.5 and 1.5 seconds after the previous one.

Check out the [MSDN documentation](http://msdn.microsoft.com/en-us/library/system.reactive.linq.observable.generate.aspx) for details of the other `Observable.Generate` overloads.

Next we subscribe to the `priceFeed` observable to send the updates to the appropriate group of clients as described in the previous section...

{% highlight csharp %}
IDisposable subscription = priceFeed.Subscribe(p => Clients[p.Symbol].updatePrice(p));
{% endhighlight %}

Notice that the `Subscribe` method on an observable returns a disposable token that we can keep hold of and dispose when all clients have unsubscribed from the stock. This will stop the observable from producing price updates when there are no longer any clients interested in the stock.

So now, adding and removing clients from the hub's `Groups`, as shown in the previous section, will result in the streams of stock price updates being transmitted in real-time to the appropriate clients.

#### A couple of Gotchas ####

As I've already suggested, the beauty of SignalR is that it hides away a load of low-level complexity making it very simple to use. As with all these things though, it's important to [understand just a little bit of what's going on behind this abstraction](http://www.hanselman.com/blog/PleaseLearnToThinkAboutAbstractions.aspx).  Here are a couple of things you might need to be aware of when working with SignalR...

A new hub object is created on the server for every client call. The hub objects themselves have no state about the clients. It might seem like the `Clients` and `Groups` properties are maintaining some static data about all clients, but they don't - all that is handled "under the hood". This means you may have to keep your own data about what connections are in what groups. In this example it meant keeping track of which clients were subscribed to which stock so I could manage the lifetime of the price feed observables.

Also, the SignalR library is written in a very asynchronous way. So, you'll see methods in the server code that, instead of blocking to return a value, will return its value asynchronously with a [`Task<TResult>`](http://msdn.microsoft.com/en-us/library/dd321424.aspx).  Likewise, on the client most methods return a [jQuery deferred object](http://api.jquery.com/category/deferred-object/). This means you might get into trouble if you try to do things sequentially. For example...

{% highlight javascript %}
// Get our stockHub JavaScript object
var stockHub = $.connection.stockHub;

// Start the connection
$.connection.hub.start();

// Subscribe to a stock immediately after starting the connection - nope...
// Uncaught Error: SignalR: Connection must be started before data can be sent.
stockHub.subscribe('XYZ');
{% endhighlight %}

We're actually calling the hub method before the connection has started. We'd need to do...

{% highlight javascript %}
// Get our stockHub JavaScript object
var stockHub = $.connection.stockHub;

// Start the connection
$.connection.hub.start().done(function() {
    // Subscribe to a stock as soon as the connection is started
    stockHub.subscribe('XYZ');
});
{% endhighlight %}

#### Summary ####

Hopefully this simple example has shown the potential of using these two libraries together in a real-time web application. The code is available on [GitHub](https://github.com/ianreah/MockStock), and you can see it in action [here](http://mockstock.apphb.com/).

In more complex situations where you might need to combine the data from multiple concurrent sources, and/or, throttle the data going to the clients, for example, then the use of Rx to present the data to be transmitted to the clients via SignalR could greatly simplify the solution.

It's also worth bearing in mind the availability of [Rx for JavaScript](http://reactive-extensions.github.com/RxJS/) opening up the possibility of pushing Rx notifications directly to the client with SignalR. (See [SignalR.Reactive](https://github.com/cburgdorf/SignalR.Reactive) for an example of a library enabling this.)